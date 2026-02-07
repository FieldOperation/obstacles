import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { registerRootComponent } from 'expo';

// Minimal test app to isolate the issue
function TestApp() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Test App - If you see this, basic setup works!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 18,
    textAlign: 'center',
    padding: 20,
  },
});

export default TestApp;
