<template>
    <div v-if="user">
      <q-avatar size="32px" class="q-mr-sm" color="orange-9" text-color="white">
        {{ user.username?.charAt(0).toUpperCase() || '?' }}
      </q-avatar>
      <span>{{ user.username || user.email }}</span>
      <q-btn color="red" flat round icon="logout" @click="logout" />
    </div>
    <div v-else-if="!loading">
      <q-btn flat to="/auth/login" :label="$t('user.login')" />
    </div>
    <div v-else>
      <q-spinner-rings
          color="red"
          size="2em"
        />
    </div>

  </template>
  
  <script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import { useAuthStore } from 'stores/auth'
  const loading = ref(true)
  const userStore = useAuthStore()
  const user = ref(userStore.user)
  
  onMounted(async () => {
    if (!userStore.user) {
      await userStore.fetchUser()
      user.value = userStore.user
    }
    loading.value = false
    
  })
  
  async function  logout() {
    await userStore.logout()
  }
  </script>
  