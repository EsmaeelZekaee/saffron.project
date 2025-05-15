<template>
  <q-layout view="lHh Lpr lFf">
    <!-- Header -->
    <q-header elevated>
      <q-toolbar class="custom-toolbar">
        <q-banner>
          <q-img :src="bannerImage" :ratio="1" style="width: 50px; height: 50px" />
        </q-banner>
        <q-toolbar-title> {{ $t('public.title') }} </q-toolbar-title>
        <user-info></user-info>
      </q-toolbar>
    </q-header>

    <!-- Sidebar -->
    <q-drawer show-if-above v-model="drawer" class="custom-drawer" side="right" overlay>
      <q-list>
        <q-item to="/" exact>
          <q-item-section>{{ $t('public.home') }}</q-item-section>
        </q-item>
        <q-item to="/auth/signup">
          <q-item-section>{{ $t('public.start') }}</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <!-- Page content -->
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import bannerImage from 'src/assets/logo.png';
import  UserInfo  from 'components/UserInfo.vue';

const drawer = ref(false);
</script>

<style scoped>
::v-deep(.fixed-top) {
  z-index: 9999 !important;
}
</style>
