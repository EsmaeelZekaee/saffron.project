<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-banner>
          <q-img
            :src="bannerImage"
            :ratio="1"
            style="width: 50px; height: 50px; cursor: pointer"
            @click="toggleLeftDrawer"
          />
        </q-banner>
        &nbsp;
        <q-toolbar-title> Saffron </q-toolbar-title>
        <user-info></user-info>
      </q-toolbar>
    </q-header>
    <q-drawer v-model="leftDrawerOpen" show-if-above bordered side="right">
      <q-list padding>
        <q-item-label header class="text-grey-8 text-bold"> {{ $t('sidebar.title') }} </q-item-label>

        <q-item clickable v-ripple to="/fb/files">
          <q-item-section avatar>
            <q-icon name="folder" />
          </q-item-section>
          <q-item-section> {{ $t('sidebar.management') }} </q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/fb/settings">
          <q-item-section avatar>
            <q-icon name="settings" />
          </q-item-section>
          <q-item-section> {{ $t('sidebar.settings') }} </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import UserInfo from 'src/components/UserInfo.vue';
import bannerImage from 'assets/logo.png';


const leftDrawerOpen = ref(false);
function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}



</script>
