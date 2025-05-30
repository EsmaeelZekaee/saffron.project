<template>
  <q-page class="flex flex-center" padding>
    <q-card class="q-pa-md" style="min-width: 500px; max-width: 400px; width: 100%">
      <q-card-section>
        <div class="text-h6">{{ t('user.login.title') }}</div>
        <div class="text-subtitle2">{{ t('user.login.hint') }}</div>
      </q-card-section>
      <q-separator />

      <q-form ref="form" @submit.prevent="handleLogin">
        <q-card-section>
          <q-input
            v-model="model.username"
            :label="t('user.fields.username')"
            :rules="[rules.required]"
            required
            dense
          />
          <q-input
            v-model="model.password"
            :label="t('user.fields.password')"
            type="password"
            :rules="[rules.required]"
            class="q-mt-md"
            required
            dense
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn :disable="!isValid" type="submit" color="primary" :label="$t('user.login.submit')" />
        </q-card-actions>
      </q-form>
      <router-link to="/auth/signup" class="text-primary text-underline">{{
        $t('user.signup.title')
      }}</router-link>
      &nbsp;&nbsp;|&nbsp;&nbsp;
      <router-link to="/" class="text-primary text-underline">{{ $t('public.home') }}</router-link>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { api } from 'src/boot/axios';
import { Notify, useQuasar } from 'quasar';
import { useAuthStore } from 'src/stores/auth';
const userStore = useAuthStore()
export interface Model {
  username: string;
  password: string;
  error: string | null;
}

const isValid = computed(() => {
  return model.value.username && model.value.password;
});

const { t } = useI18n();
const router = useRouter();

const model = ref<Model>({
  username: 'jikal',
  password: 'ronak',
  error: null,
});
const $q = useQuasar();
const rules = {
  required: (v: string) => !!v || t('field_required'),
};

const handleLogin = async () => {
  $q.loadingBar.start();
  try {
    const res = await api.post('/auth/login', {
      username: model.value.username,
      password: model.value.password,
    });
    localStorage.setItem('token', res.data.token);
    userStore.token = res.data.token;
    Notify.create({
      type: 'positive',
      message: t('user.login.success'),
    });
    await router.push({ name: 'Forms' });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    
    if (error instanceof Error && 'response' in error) {
      const err = error as { response: { data: { error: string } } };
      model.value.error = t(err.response.data.error) || t('error_generic');
    } else {
      model.value.error = t('error_generic');
    }
  } finally {
    $q.loadingBar.stop();
  }
};
</script>

<style scoped></style>
