<template>
  <q-page class="flex flex-center">
    <q-card class="q-pa-xl shadow-2 rounded-borders" style="max-width: 600px; width: 100%">
      <q-card-section class="text-center">
        <q-icon name="mdi-cube-outline" size="48px" color="primary" />
        <div class="text-h4 q-mt-md">Saffron</div>
        <div class="text-subtitle2 q-mt-sm text-grey-7">
          ساخت فرم، پر کردن فایل‌های PDF، و افزودن یادداشت به آن‌ها — همه در یک وب‌اپلیکیشن
        </div>
      </q-card-section>

      <q-separator spaced />

      <q-card-section class="text-body1 text-justify">
        Saffron یک ابزار قدرتمند تحت وب است که به کاربران اجازه می‌دهد به‌راحتی فایل‌های PDF را آپلود کرده، فرم‌ها را پر کنند، 
        یادداشت یا Annotation اضافه کرده و در نهایت فایل نهایی را ذخیره یا پرینت کنند.  
        این اپلیکیشن مناسب شرکت‌ها، کارمندان اداری، و دفاتر خدماتی است که نیاز به پردازش اسناد دارند.
      </q-card-section>

      <q-card-actions align="center">
        <q-btn label="شروع کنید" color="primary" to="/fb/" />
      </q-card-actions>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
//
</script>

<style scoped>
.text-justify {
  text-align: justify;
}
</style>
