<template>
  <q-page class="flex flex-center" padding>
    <q-card class="q-pa-md" style="min-width: 500px; max-width: 400px; width: 100%">
      <q-card-section>
        <div class="text-h6">{{ $t('user.signup') }}</div>
        <div class="text-subtitle2">{{ $t('user.signupHint') }}</div>
      </q-card-section>

      <q-separator />
      <q-form @submit.prevent="handleSignup" class="signup-form">
        <q-card-section>
          <q-input
            v-model="model.username"
            :label="$t('user.username')"
            :rules="[rules.required]"
            dense
            required
            class="q-mb-md"
          />
          <q-input
            v-model="model.email"
            :label="$t('user.email')"
            :rules="[rules.required, rules.email]"
            dense
            type="email"
            required
            class="q-mb-md"
          />
          <q-input
            v-model="model.password"
            :label="$t('user.password')"
            :rules="[rules.required]"
            dense
            type="password"
            required
          />
        </q-card-section>

        <q-card-actions align="center">
          <q-btn
            :label="$t('user.signupSubmit')"
            color="primary"
            type="submit"
            :disable="!isValid"
            unelevated
            class="full-width"
          />
        </q-card-actions>
      </q-form>
      <transition name="fade">
        <q-banner v-if="model.error" class="bg-red text-white q-ma-sm" inline-actions>
          {{ model.error }}
        </q-banner>
      </transition>
      <router-link to="/auth/login" class="text-primary text-underline">{{
        $t('user.login')
      }}</router-link>
      &nbsp;&nbsp;|&nbsp;&nbsp;
      <router-link to="/" class="text-primary text-underline">{{ $t('public.home') }}</router-link>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { api } from 'src/boot/axios';
import { Notify } from 'quasar';
import { useQuasar } from 'quasar';
const $q = useQuasar()
export interface Model {
  username: string;
  email: string;
  password: string;
  error: string | null;
}

const { t } = useI18n();
const router = useRouter();

const model = ref<Model>({
  username: 'jikal',
  email: 'jikal@ronak.esi',
  password: 'ronak',
  error: null,
});

const rules = {
  required: (val: string) => !!val || t('field_required'),
  email: (val: string) => /.+@.+\..+/.test(val) || t('email_invalid'),
};

const isValid = computed(() => {
  return (
    model.value.username &&
    model.value.email &&
    /.+@.+\..+/.test(model.value.email) &&
    model.value.password
  );
});

const handleSignup = async () => {
  model.value.error = null;
  console.log($q)
  $q.loadingBar.start()
  try {
    await api.post('/auth/register', {
      username: model.value.username,
      email: model.value.email,
      password: model.value.password,
    });

    Notify.create({
      type: 'positive',
      message: t('user.signupSuccess'),
    });

    await router.push({ name: 'login' });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error instanceof Error && 'response' in error) {
      const err = error as { response: { data: { error: string } } };
      model.value.error = t(err.response.data.error) || t('error_generic');
    } else {
      model.value.error = t('error_generic');
    }
  }
  finally{
    $q.loadingBar.stop()
  }
};
</script>

<style scoped></style>
