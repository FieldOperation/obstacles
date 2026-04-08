import { supabase, supabaseUrl } from '../lib/supabase';
import { usernameToEmail } from '../lib/authConstants';

/** Normalize storage path: no leading slash, no duplicate bucket prefix */
function normalizeStoragePath(filename: string): string {
  let path = String(filename).trim().replace(/^\//, '');
  if (path.startsWith('cases/')) path = path.slice(6);
  return path;
}

/** Build public URL for cases bucket (same format as frontend; works when bucket is public) */
function buildCasesPublicUrl(path: string): string {
  const base = supabaseUrl.replace(/\/$/, '');
  return `${base}/storage/v1/object/public/cases/${encodeURIComponent(path)}`;
}

/** Resolve photo URL: try signed first, then always fall back to public URL */
async function resolvePhotoUrl(filename: string): Promise<string | null> {
  const path = normalizeStoragePath(filename);
  if (!path) return null;
  try {
    const { data: signed, error } = await supabase.storage
      .from('cases')
      .createSignedUrl(path, 3600);
    const url = signed?.signedUrl ?? (signed as any)?.signedURL;
    if (!error && url) return url;
  } catch {
    // fall through to public
  }
  return buildCasesPublicUrl(path);
}

// Helper to get current user from Supabase session
const getCurrentUserId = async (): Promise<string | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
};

// Cases Service
export const casesService = {
  async getAll(filters: any = {}, page = 1, limit = 20) {
    console.log('📋 Cases: Fetching cases...', { filters, page, limit });
    const userId = await getCurrentUserId();
    if (!userId) {
      console.error('❌ Cases: No user ID');
      throw new Error('User not authenticated');
    }
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, zone_id')
      .eq('id', userId)
      .single();
    
    if (userError) {
      console.error('❌ Cases: Error fetching user:', userError);
      throw userError;
    }
    
    const user = userData;
    console.log('📋 Cases: User role:', user?.role);
    
    let query = supabase
      .from('cases')
      .select(`
        *,
        zones:zone_id (id, name),
        roads:road_id (id, name),
        developers:developer_id (id, name),
        created_by:created_by_id (id, name, email),
        closed_by:closed_by_id (id, name, email),
        photos!photos_case_id_fkey (*),
        closure_photos:photos!photos_closure_case_id_fkey (*)
      `)
      .order('created_at', { ascending: false });

    // Apply role-based filtering
    if (user?.role === 'WORKER' && !user.zone_id) {
      query = query.eq('created_by_id', userId);
    } else if (user?.role === 'WORKER' && user.zone_id) {
      query = query.eq('zone_id', user.zone_id);
    }

    // Apply filters
    if (filters.type) query = query.eq('type', filters.type);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.zoneId) query = query.eq('zone_id', filters.zoneId);
    if (filters.roadId) query = query.eq('road_id', filters.roadId);
    if (filters.developerId) query = query.eq('developer_id', filters.developerId);
    if (filters.search && String(filters.search).trim()) {
      const term = `%${String(filters.search).trim()}%`;
      query = query.or(`case_number.ilike.${term},description.ilike.${term}`);
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    console.log('📋 Cases: Executing query...');
    const { data, error } = await query;

    if (error) {
      console.error('❌ Cases: Error fetching cases:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      throw error;
    }
    
    console.log('✅ Cases: Fetched', data?.length || 0, 'cases');

    // Get total count
    const { count: totalCount } = await supabase
      .from('cases')
      .select('*', { count: 'exact', head: true });

    return {
      cases: data || [],
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        pages: Math.ceil((totalCount || 0) / limit),
      },
    };
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('cases')
      .select(`
        *,
        zones:zone_id (id, name),
        roads:road_id (id, name),
        developers:developer_id (id, name),
        created_by:created_by_id (id, name, email),
        closed_by:closed_by_id (id, name, email),
        photos!photos_case_id_fkey (*),
        closure_photos:photos!photos_closure_case_id_fkey (*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return { case: data };

    const photos = (data.photos || []).map((p: any) => ({ ...p, filename: p.filename ?? p.file_name }));
    const closurePhotos = (data.closure_photos || []).map((p: any) => ({ ...p, filename: p.filename ?? p.file_name }));

    data.photos = await Promise.all(
      photos.map(async (p: any) => {
        const url = await resolvePhotoUrl(p.filename);
        return { ...p, url: url || undefined };
      })
    );
    data.closure_photos = await Promise.all(
      closurePhotos.map(async (p: any) => {
        const url = await resolvePhotoUrl(p.filename);
        return { ...p, url: url || undefined };
      })
    );
    // Keep all photos; UI will use photo.url or fallback to getPublicUrl(photo.filename)
    // data.photos = data.photos.filter((p: any) => p.url);
    // data.closure_photos = data.closure_photos.filter((p: any) => p.url);

    return { case: data };
  },

  async create(caseData: any, photos: File[] = []) {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    // Upload photos to Supabase Storage first
    const photoUrls: any[] = [];
    for (const photo of photos) {
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${photo.name}`;
      const { error: uploadError } = await supabase.storage
        .from('cases')
        .upload(fileName, photo);

      if (uploadError) throw uploadError;

      photoUrls.push({
        filename: fileName,
        original_name: photo.name,
        mime_type: photo.type,
        size: photo.size,
        latitude: caseData.photoLatitude || null,
        longitude: caseData.photoLongitude || null,
      });
    }

    // Create case
    const { data: caseRecord, error: caseError } = await supabase
      .from('cases')
      .insert({
        type: caseData.type,
        zone_id: caseData.zoneId,
        road_id: caseData.roadId,
        developer_id: caseData.developerId || null,
        description: caseData.description,
        planned_work: caseData.type === 'OBSTACLE' ? caseData.plannedWork : null,
        latitude: parseFloat(caseData.latitude),
        longitude: parseFloat(caseData.longitude),
        created_by_id: userId,
        status: 'OPEN',
      })
      .select()
      .single();

    if (caseError) throw caseError;

    // Create photos
    if (photoUrls.length > 0) {
      const { error: photosError } = await supabase
        .from('photos')
        .insert(
          photoUrls.map(photo => ({
            ...photo,
            case_id: caseRecord.id,
          }))
        );

      if (photosError) throw photosError;
    }

    // Create notifications for OTHERS role users
    const { data: othersUsers } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'OTHERS');

    if (othersUsers && othersUsers.length > 0) {
      const { data: zone } = await supabase
        .from('zones')
        .select('name')
        .eq('id', caseData.zoneId)
        .single();

      const { data: road } = await supabase
        .from('roads')
        .select('name')
        .eq('id', caseData.roadId)
        .single();

      await supabase.from('notifications').insert(
        othersUsers.map(u => ({
          user_id: u.id,
          case_id: caseRecord.id,
          title: `New ${caseData.type} Case Created`,
          message: `A new ${caseData.type.toLowerCase()} case has been created in ${zone?.name} - ${road?.name}`,
          read: false,
        }))
      );
    }

    return { case: caseRecord };
  },

  async update(id: string, updates: any) {
    const { data, error } = await supabase
      .from('cases')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { case: data };
  },

  async close(id: string, closureNotes: string, closurePhotos: File[] = []) {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    // Upload closure photos
    const photoUrls: any[] = [];
    for (const photo of closurePhotos) {
      const fileName = `closure-${Date.now()}-${Math.random().toString(36).substring(7)}-${photo.name}`;
      const { error: uploadError } = await supabase.storage
        .from('cases')
        .upload(fileName, photo);

      if (uploadError) throw uploadError;

      photoUrls.push({
        filename: fileName,
        original_name: photo.name,
        mime_type: photo.type,
        size: photo.size,
        case_id: id,
        closure_case_id: id,
      });
    }

    // Update case
    const { data: caseRecord, error: caseError } = await supabase
      .from('cases')
      .update({
        status: 'CLOSED',
        closed_by_id: userId,
        closed_at: new Date().toISOString(),
        closure_notes: closureNotes,
      })
      .eq('id', id)
      .select()
      .single();

    if (caseError) throw caseError;

    // Create closure photos
    if (photoUrls.length > 0) {
      await supabase.from('photos').insert(photoUrls);
    }

    return { case: caseRecord };
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('cases')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

// Zones Service
export const zonesService = {
  async getAll() {
    console.log('📍 Zones: Fetching zones...');
    const { data: zones, error } = await supabase
      .from('zones')
      .select('*')
      .order('name');

    if (error) {
      console.error('❌ Zones: Error fetching zones:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      throw error;
    }

    // Get roads and cases counts per zone
    const [roadsRes, casesRes] = await Promise.all([
      supabase.from('roads').select('zone_id'),
      supabase.from('cases').select('zone_id'),
    ]);

    const roadsByZone = (roadsRes.data || []).reduce<Record<string, number>>((acc, r) => {
      if (r.zone_id) {
        acc[r.zone_id] = (acc[r.zone_id] || 0) + 1;
      }
      return acc;
    }, {});
    const casesByZone = (casesRes.data || []).reduce<Record<string, number>>((acc, c) => {
      if (c.zone_id) {
        acc[c.zone_id] = (acc[c.zone_id] || 0) + 1;
      }
      return acc;
    }, {});

    const zonesWithCount = (zones || []).map(z => ({
      ...z,
      _count: {
        roads: roadsByZone[z.id] || 0,
        cases: casesByZone[z.id] || 0,
      },
    }));
    
    console.log('✅ Zones: Fetched', zonesWithCount.length, 'zones');
    return { zones: zonesWithCount };
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('zones')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { zone: data };
  },

  async create(zoneData: { name: string }) {
    const { data, error } = await supabase
      .from('zones')
      .insert(zoneData)
      .select()
      .single();

    if (error) throw error;
    return { zone: data };
  },

  async update(id: string, updates: { name: string }) {
    const { data, error } = await supabase
      .from('zones')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { zone: data };
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('zones')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

// Roads Service
export const roadsService = {
  async getAll(zoneId?: string) {
    let query = supabase
      .from('roads')
      .select(`
        *,
        zones:zone_id (id, name)
      `)
      .order('name');

    if (zoneId) {
      query = query.eq('zone_id', zoneId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { roads: data || [] };
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('roads')
      .select(`
        *,
        zones:zone_id (id, name)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return { road: data };
  },

  async create(roadData: { name: string; zoneId: string }) {
    const { data, error } = await supabase
      .from('roads')
      .insert({
        name: roadData.name,
        zone_id: roadData.zoneId,
      })
      .select()
      .single();

    if (error) throw error;
    return { road: data };
  },

  async update(id: string, updates: { name: string; zoneId?: string }) {
    const updateData: any = { name: updates.name };
    if (updates.zoneId) updateData.zone_id = updates.zoneId;

    const { data, error } = await supabase
      .from('roads')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { road: data };
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('roads')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

// Developers Service
export const developersService = {
  async getAll() {
    const { data: developers, error } = await supabase
      .from('developers')
      .select('*')
      .order('name');

    if (error) throw error;

    // Get case counts per developer
    const { data: cases } = await supabase
      .from('cases')
      .select('developer_id');

    const countByDeveloper = (cases || []).reduce<Record<string, number>>((acc, c) => {
      if (c.developer_id) {
        acc[c.developer_id] = (acc[c.developer_id] || 0) + 1;
      }
      return acc;
    }, {});

    const developersWithCount = (developers || []).map(d => ({
      ...d,
      _count: { cases: countByDeveloper[d.id] || 0 }
    }));

    return { developers: developersWithCount };
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('developers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { developer: data };
  },

  async create(developerData: { name: string }) {
    const { data, error } = await supabase
      .from('developers')
      .insert(developerData)
      .select()
      .single();

    if (error) throw error;
    return { developer: data };
  },

  async update(id: string, updates: { name: string }) {
    const { data, error } = await supabase
      .from('developers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { developer: data };
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('developers')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

// Users Service
export const usersService = {
  async getAll(filters: any = {}, page = 1, limit = 50) {
    let query = supabase
      .from('users')
      .select(`
        id,
        email,
        name,
        role,
        zone_id,
        created_at,
        updated_at,
        zones:zone_id (id, name)
      `)
      .order('created_at', { ascending: false });

    if (filters.role) query = query.eq('role', filters.role);
    if (filters.zoneId) query = query.eq('zone_id', filters.zoneId);

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error } = await query;

    if (error) throw error;

    const { count: totalCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    return {
      users: data || [],
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        pages: Math.ceil((totalCount || 0) / limit),
      },
    };
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        name,
        role,
        zone_id,
        created_at,
        updated_at,
        zones:zone_id (id, name)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return { user: data };
  },

  async create(userData: any) {
    // Username-only auth: store as email internally (username@obstacles.local)
    const username = (userData.username || userData.name || '').trim();
    if (!username) throw new Error('Username is required');
    const email = usernameToEmail(username);
    const name = (userData.name || username).trim();
    const password = userData.password;
    if (!password || password.length < 6) throw new Error('Password is required (min 6 characters)');

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: undefined,
      },
    });

    if (authError) {
      // Supabase rate-limits auth emails when "Confirm email" is enabled
      if (authError.message?.toLowerCase().includes('rate limit') || (authError as any).status === 429) {
        throw new Error(
          'Email rate limit exceeded. Turn off "Confirm email" in Supabase: Authentication → Providers → Email → disable "Confirm email". Then new users can be created without sending emails.'
        );
      }
      throw authError;
    }
    if (!authData.user) throw new Error('Failed to create auth user');

    const { data, error } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        name,
        role: userData.role || 'OTHERS',
        zone_id: userData.zoneId || null,
      })
      .select()
      .single();

    if (error) {
      const { data: updateData, error: updateError } = await supabase
        .from('users')
        .update({
          email,
          name,
          role: userData.role || 'OTHERS',
          zone_id: userData.zoneId || null,
        })
        .eq('id', authData.user.id)
        .select()
        .single();

      if (updateError) throw updateError;
      return { user: updateData };
    }

    return { user: data };
  },

  async update(id: string, updates: any) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { user: data };
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

// Dashboard Service
export const dashboardService = {
  async getStats(filters: any = {}) {
    console.log('📊 Dashboard: Fetching stats...');
    const userId = await getCurrentUserId();
    if (!userId) {
      console.error('❌ Dashboard: No user ID');
      throw new Error('User not authenticated');
    }
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, zone_id')
      .eq('id', userId)
      .single();
    
    if (userError) {
      console.error('❌ Dashboard: Error fetching user:', userError);
      throw userError;
    }
    
    const user = userData;
    console.log('📊 Dashboard: User role:', user?.role);
    
    let query = supabase.from('cases').select('*');

    // Apply role-based filtering
    if (user?.role === 'WORKER' && user.zone_id) {
      query = query.eq('zone_id', user.zone_id);
    } else if (user?.role === 'WORKER' && !user.zone_id) {
      query = query.eq('created_by_id', userId);
    }

    // Apply filters
    if (filters.startDate || filters.endDate) {
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate);
      }
    }
    if (filters.zoneId) query = query.eq('zone_id', filters.zoneId);
    if (filters.roadId) query = query.eq('road_id', filters.roadId);
    if (filters.developerId) query = query.eq('developer_id', filters.developerId);
    if (filters.type) query = query.eq('type', filters.type);

    console.log('📊 Dashboard: Fetching cases...');
    const { data: allCases, error } = await query;

    if (error) {
      console.error('❌ Dashboard: Error fetching cases:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      throw error;
    }
    
    console.log('✅ Dashboard: Cases fetched:', allCases?.length || 0);

    // Calculate statistics (similar to backend logic)
    const totalCases = allCases?.length || 0;
    const openCases = allCases?.filter(c => c.status === 'OPEN').length || 0;
    const closedCases = allCases?.filter(c => c.status === 'CLOSED').length || 0;

    // Get zones, roads, developers for names
    console.log('📊 Dashboard: Fetching zones, roads, developers...');
    const [zones, roads, developers] = await Promise.all([
      supabase.from('zones').select('id, name'),
      supabase.from('roads').select('id, name, zone_id, zones:zone_id (name)'),
      supabase.from('developers').select('id, name'),
    ]);
    
    if (zones.error) {
      console.error('❌ Dashboard: Error fetching zones:', zones.error);
    } else {
      console.log('✅ Dashboard: Zones fetched:', zones.data?.length || 0);
    }
    
    if (roads.error) {
      console.error('❌ Dashboard: Error fetching roads:', roads.error);
    } else {
      console.log('✅ Dashboard: Roads fetched:', roads.data?.length || 0);
    }
    
    if (developers.error) {
      console.error('❌ Dashboard: Error fetching developers:', developers.error);
    } else {
      console.log('✅ Dashboard: Developers fetched:', developers.data?.length || 0);
    }

    // Calculate grouped statistics
    const casesByZone = Object.entries(
      (allCases || []).reduce((acc: any, c: any) => {
        acc[c.zone_id] = (acc[c.zone_id] || 0) + 1;
        return acc;
      }, {})
    ).map(([zoneId, count]) => ({
      zoneId,
      zoneName: zones.data?.find((z: any) => z.id === zoneId)?.name || 'Unknown',
      count,
    }));

    const casesByRoad = Object.entries(
      (allCases || []).reduce((acc: any, c: any) => {
        acc[c.road_id] = (acc[c.road_id] || 0) + 1;
        return acc;
      }, {})
    ).map(([roadId, count]) => {
      const road = roads.data?.find((r: any) => r.id === roadId);
      const zone = road?.zones;
      const zoneName = (zone && typeof zone === 'object' && !Array.isArray(zone) && 'name' in zone) ? (zone as { name: string }).name : 'Unknown';
      return {
        roadId,
        roadName: road?.name || 'Unknown',
        zoneName: zoneName || 'Unknown',
        count,
      };
    });

    const casesByDeveloper = Object.entries(
      (allCases || [])
        .filter((c: any) => c.developer_id)
        .reduce((acc: any, c: any) => {
          acc[c.developer_id] = (acc[c.developer_id] || 0) + 1;
          return acc;
        }, {})
    ).map(([developerId, count]) => ({
      developerId,
      developerName: developers.data?.find((d: any) => d.id === developerId)?.name || 'Unknown',
      count,
    }));

    const casesByType = Object.entries(
      (allCases || []).reduce((acc: any, c: any) => {
        acc[c.type] = (acc[c.type] || 0) + 1;
        return acc;
      }, {})
    ).map(([type, count]) => ({
      type,
      count,
    }));

    // Calculate average resolution time
    const closedCasesWithTime = (allCases || []).filter(
      (c: any) => c.status === 'CLOSED' && c.closed_at
    );
    const averageResolutionTime =
      closedCasesWithTime.length > 0
        ? closedCasesWithTime.reduce((sum: number, c: any) => {
            return sum + (new Date(c.closed_at).getTime() - new Date(c.created_at).getTime());
          }, 0) /
          closedCasesWithTime.length /
          (1000 * 60 * 60)
        : null;

    // Cases over time
    const startDateFilter = filters.startDate
      ? new Date(filters.startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const filteredCases = (allCases || []).filter(
      (c: any) => new Date(c.created_at) >= startDateFilter
    );
    const casesOverTime = Object.entries(
      filteredCases.reduce((acc: any, c: any) => {
        const date = c.created_at.split('T')[0];
        if (!acc[date]) {
          acc[date] = { created: 0, closed: 0, obstacle: 0, damage: 0 };
        }
        acc[date].created++;
        if (c.status === 'CLOSED') acc[date].closed++;
        if (c.type === 'OBSTACLE') acc[date].obstacle++;
        if (c.type === 'DAMAGE') acc[date].damage++;
        return acc;
      }, {})
    ).map(([date, counts]) => ({
      date,
      ...(counts as any),
    }));

    return {
      totalCases,
      openCases,
      closedCases,
      casesByZone,
      casesByRoad,
      casesByDeveloper,
      casesByType,
      averageResolutionTimeHours: averageResolutionTime,
      casesOverTime,
    };
  },
};

// Settings Service
export const settingsService = {
  async get() {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    
    // If no settings exist, return defaults
    if (!data) {
      return {
        contractor_logo_url: null,
        owner_logo_url: null,
        contractorLogoUrl: null,
        ownerLogoUrl: null,
      };
    }

    // DB columns are contractor_logo, owner_logo (file path in storage)
    const contractorLogoUrl = data.contractor_logo
      ? supabase.storage.from('logos').getPublicUrl(data.contractor_logo).data.publicUrl
      : null;
    const ownerLogoUrl = data.owner_logo
      ? supabase.storage.from('logos').getPublicUrl(data.owner_logo).data.publicUrl
      : null;

    return {
      ...data,
      contractor_logo_url: contractorLogoUrl,
      contractorLogoUrl: contractorLogoUrl,
      owner_logo_url: ownerLogoUrl,
      ownerLogoUrl: ownerLogoUrl,
    };
  },

  async uploadLogo(file: File, logoType: 'contractor' | 'owner') {
    const fileExt = file.name.split('.').pop();
    const fileName = `${logoType}-${Date.now()}.${fileExt}`;
    const filePath = fileName;

    const { error: uploadError } = await supabase.storage
      .from('logos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // DB columns: contractor_logo, owner_logo
    const logoField = logoType === 'contractor' ? 'contractor_logo' : 'owner_logo';

    const { data: existing } = await supabase
      .from('system_settings')
      .select('id')
      .single();

    if (existing) {
      const { data, error } = await supabase
        .from('system_settings')
        .update({ [logoField]: filePath })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('system_settings')
        .insert({ [logoField]: filePath })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  },

  async deleteLogo(logoType: 'contractor' | 'owner') {
    const logoField = logoType === 'contractor' ? 'contractor_logo' : 'owner_logo';

    const { data: settings } = await supabase
      .from('system_settings')
      .select(logoField)
      .single();

    const path = settings ? (settings as Record<string, string | null>)[logoField] : null;
    if (path) {
      const { error: storageError } = await supabase.storage
        .from('logos')
        .remove([path]);

      if (storageError) throw storageError;
    }

    const { data: existing } = await supabase
      .from('system_settings')
      .select('id')
      .single();

    if (existing) {
      const { data, error } = await supabase
        .from('system_settings')
        .update({ [logoField]: null })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  },
};
