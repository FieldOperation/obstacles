import { decode as decodeBase64 } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../lib/supabase';

/** Resolve photo URL: try signed URL first (works for private buckets), fallback to public URL */
async function resolvePhotoUrl(filename: string): Promise<string | null> {
  if (!filename || typeof filename !== 'string') return null;
  const path = String(filename).trim().replace(/^\//, '');
  if (!path) return null;
  try {
    const { data: signed, error } = await supabase.storage
      .from('cases')
      .createSignedUrl(path, 3600);
    const url = signed?.signedUrl ?? (signed as any)?.signedURL;
    if (!error && url) return url;
  } catch {
    // Fall through to public URL
  }
  const { data: pub } = supabase.storage.from('cases').getPublicUrl(path);
  return pub?.publicUrl ?? null;
}

/** Resolve logo URL: try signed URL first (private buckets), then public URL (public buckets) */
async function resolveLogoUrl(filename: string): Promise<string | null> {
  if (!filename || typeof filename !== 'string') return null;
  const path = filename.trim().replace(/^\//, '');
  if (!path) return null;
  try {
    const { data: signed, error } = await supabase.storage
      .from('logos')
      .createSignedUrl(path, 3600);
    const url = signed?.signedUrl ?? (signed as any)?.signedURL;
    if (!error && url) return url;
  } catch {
    // Fall through to public URL
  }
  const { data: pub } = supabase.storage.from('logos').getPublicUrl(path);
  return pub.publicUrl;
}

const getCurrentUserId = async (): Promise<string | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
};

/**
 * Convert React Native image URI to Blob for Supabase upload.
 * Uses expo-file-system so local/content URIs (from ImagePicker) are read correctly;
 * fetch(uri) often fails on Android and can produce empty uploads.
 */
async function uriToBlob(uri: string): Promise<Blob> {
  let readUri = uri;
  try {
    // Android: content:// URIs must be copied to a file path before reading
    if (uri.startsWith('content://')) {
      const dest = `${FileSystem.cacheDirectory}upload_${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
      await FileSystem.copyAsync({ from: uri, to: dest });
      readUri = dest;
    } else if (uri.startsWith('file://')) {
      readUri = uri;
    }
    const base64 = await FileSystem.readAsStringAsync(readUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    if (!base64) throw new Error('Empty file');
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: 'image/jpeg' });
  } catch {
    // Fallback: fetch works for some URI types (e.g. file:// on iOS)
    const response = await fetch(uri);
    const blob = await response.blob();
    if (blob.size === 0) throw new Error('Image file is empty or could not be read');
    return blob;
  }
}

export const casesService = {
  async getAll(filters: any = {}, page = 1, limit = 50) {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, zone_id')
      .eq('id', userId)
      .single();

    if (userError) throw userError;
    const user = userData;

    let query = supabase
      .from('cases')
      .select(`
        *,
        zones:zone_id (id, name),
        roads:road_id (id, name),
        developers:developer_id (id, name),
        created_by:created_by_id (id, name, email),
        closed_by:closed_by_id (id, name, email)
      `)
      .order('created_at', { ascending: false });

    if (user?.role === 'WORKER' && !user.zone_id) {
      query = query.eq('created_by_id', userId);
    } else if (user?.role === 'WORKER' && user.zone_id) {
      query = query.eq('zone_id', user.zone_id);
    }
    if (filters.type) query = query.eq('type', filters.type);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.zoneId) query = query.eq('zone_id', filters.zoneId);
    if (filters.roadId) query = query.eq('road_id', filters.roadId);

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: cases, error } = await query;
    if (error) throw error;

    const { count } = await supabase
      .from('cases')
      .select('*', { count: 'exact', head: true });

    return {
      cases: cases || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
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
        closed_by:closed_by_id (id, name, email)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    // Fetch photos directly (more reliable than embedded relations)
    const { data: casePhotos } = await supabase
      .from('photos')
      .select('*')
      .eq('case_id', id)
      .is('closure_case_id', null);
    const { data: closurePhotos } = await supabase
      .from('photos')
      .select('*')
      .eq('closure_case_id', id);

    if (data) {
      const openPhotos = (casePhotos || []).map((p: any) => ({ ...p, filename: p.filename ?? p.file_name }));
      const closurePhotosList = (closurePhotos || []).map((p: any) => ({ ...p, filename: p.filename ?? p.file_name }));
      data.photos = await Promise.all(
        openPhotos.map(async (p: any) => {
          const url = await resolvePhotoUrl(p.filename);
          return { ...p, url: url || undefined };
        })
      );
      data.closure_photos = await Promise.all(
        closurePhotosList.map(async (p: any) => {
          const url = await resolvePhotoUrl(p.filename);
          return { ...p, url: url || undefined };
        })
      );
      // Filter out photos that have no resolvable URL so UI doesn't show broken images
      data.photos = (data.photos as any[]).filter((p: any) => p.url);
      data.closure_photos = (data.closure_photos as any[]).filter((p: any) => p.url);
    }

    return { case: data };
  },

  async create(
    caseData: any,
    photoUrisOrItems: (string | { uri: string; base64?: string })[] = []
  ) {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const photoRecords: any[] = [];
    for (const item of photoUrisOrItems) {
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
      const uri = typeof item === 'string' ? item : item.uri;
      const base64 = typeof item === 'object' && item.base64 ? item.base64 : undefined;

      let size: number;
      if (base64) {
        const arrayBuffer = decodeBase64(base64);
        const { error: uploadError } = await supabase.storage
          .from('cases')
          .upload(fileName, arrayBuffer, { contentType: 'image/jpeg' });
        if (uploadError) throw uploadError;
        size = arrayBuffer.byteLength;
      } else {
        const blob = await uriToBlob(uri);
        const { error: uploadError } = await supabase.storage
          .from('cases')
          .upload(fileName, blob, { contentType: 'image/jpeg' });
        if (uploadError) throw uploadError;
        size = blob.size;
      }

      photoRecords.push({
        filename: fileName,
        original_name: 'photo.jpg',
        mime_type: 'image/jpeg',
        size,
        latitude: caseData.photoLatitude || null,
        longitude: caseData.photoLongitude || null,
      });
    }

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

    if (photoRecords.length > 0) {
      const photosToInsert = photoRecords.map(p => ({
        ...p,
        case_id: caseRecord.id,
      }));
      const { error: photosError } = await supabase.from('photos').insert(photosToInsert);
      if (photosError) throw photosError;
    }

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
          message: `A new ${caseData.type.toLowerCase()} case in ${zone?.name || ''} - ${road?.name || ''}`,
          read: false,
        }))
      );

      // Send push notifications (works when app is closed)
      const { getOthersUserPushTokens, sendPushNotifications } = await import('./pushService');
      const tokens = await getOthersUserPushTokens();
      if (tokens.length > 0) {
        const msg = `New ${caseData.type} case in ${zone?.name || ''} - ${road?.name || ''}`;
        sendPushNotifications(tokens.map((to) => ({ to, title: 'New Case Created', body: msg, data: { caseId: caseRecord.id } })));
      }
    }

    return { case: caseRecord };
  },

  async close(id: string, closureNotes: string, closurePhotoUris: string[] = []) {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const photoRecords: any[] = [];
    for (const uri of closurePhotoUris) {
      const fileName = `closure-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
      const blob = await uriToBlob(uri);
      const { error: uploadError } = await supabase.storage
        .from('cases')
        .upload(fileName, blob, { contentType: 'image/jpeg' });
      if (uploadError) throw uploadError;
      photoRecords.push({
        filename: fileName,
        original_name: 'closure.jpg',
        mime_type: 'image/jpeg',
        size: blob.size,
        case_id: id,
        closure_case_id: id,
      });
    }

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

    if (photoRecords.length > 0) {
      await supabase.from('photos').insert(photoRecords);
    }

    // Notify OTHERS users of case closure and send push
    const { data: othersUsers } = await supabase.from('users').select('id').eq('role', 'OTHERS');
    const { data: caseData } = await supabase.from('cases').select('zones:zone_id (name), roads:road_id (name), type').eq('id', id).single();
    if (othersUsers?.length) {
      await supabase.from('notifications').insert(
        othersUsers.map(u => ({
          user_id: u.id,
          case_id: id,
          title: 'Case Closed',
          message: `${caseData?.type || 'Case'} in ${(caseData as any)?.zones?.name || ''} - ${(caseData as any)?.roads?.name || ''} has been closed`,
          read: false,
        }))
      );
      const { getOthersUserPushTokens, sendPushNotifications } = await import('./pushService');
      const tokens = await getOthersUserPushTokens();
      if (tokens.length > 0) {
        const msg = `${caseData?.type || 'Case'} has been closed`;
        sendPushNotifications(tokens.map((to) => ({ to, title: 'Case Closed', body: msg, data: { caseId: id } })));
      }
    }

    return { case: caseRecord };
  },
};

export const zonesService = {
  async getAll() {
    const { data: zones, error } = await supabase
      .from('zones')
      .select('*')
      .order('name');
    if (error) throw error;
    return { zones: zones || [] };
  },
};

export const roadsService = {
  async getAll(zoneId: string) {
    const { data: roads, error } = await supabase
      .from('roads')
      .select('*')
      .eq('zone_id', zoneId)
      .order('name');
    if (error) throw error;
    return { roads: roads || [] };
  },
};

export const developersService = {
  async getAll() {
    const { data: developers, error } = await supabase
      .from('developers')
      .select('*')
      .order('name');
    if (error) throw error;
    return { developers: developers || [] };
  },
};

export const settingsService = {
  async get() {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (!data) {
      return {
        contractor_logo_url: null,
        owner_logo_url: null,
        contractorLogoUrl: null,
        ownerLogoUrl: null,
      };
    }

    const contractorLogoUrl = data.contractor_logo
      ? await resolveLogoUrl(data.contractor_logo)
      : null;
    const ownerLogoUrl = data.owner_logo
      ? await resolveLogoUrl(data.owner_logo)
      : null;

    return {
      ...data,
      contractor_logo_url: contractorLogoUrl,
      contractorLogoUrl: contractorLogoUrl || null,
      owner_logo_url: ownerLogoUrl,
      ownerLogoUrl: ownerLogoUrl || null,
    };
  },
};
