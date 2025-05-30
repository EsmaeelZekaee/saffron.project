<template>
  <q-layout view="lHh Lpr lFf">
    <q-header >
      <q-bar>
        <q-btn dense flat icon="menu">
          <!-- Automatic toggle behavior -->
          <q-menu anchor="bottom left" self="top left">
            <q-list style="min-width: 150px">
              <q-item clickable v-close-popup to="/f/c">
                <q-item-section>{{ $t('forms.toolbar.title') }}</q-item-section>
              </q-item>
              <q-item clickable v-close-popup>
                <q-item-section>{{ $t('sidebar.settings') }}</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
        <q-space></q-space>
        <user-info></user-info>
      </q-bar>
    </q-header>
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>
<script setup lang="ts">
import UserInfo from 'src/components/UserInfo.vue'
</script>
