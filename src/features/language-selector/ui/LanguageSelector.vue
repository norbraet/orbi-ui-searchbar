<script setup lang="ts">
  import { computed } from 'vue'
  import { useI18n } from 'vue-i18n'
  import BaseSelect from '@/shared/components/BaseSelect/BaseSelect.vue'
  import {
    DEFAULT_LOCALE,
    LOCALE_META,
    SUPPORTED_LOCALES,
    isLocale,
  } from '@/shared/i18n/config/locales'
  import { setStoredLocale } from '@/shared/i18n/lib/persistLocale'

  const { t, locale } = useI18n()
  const currentLocale = computed(() => (isLocale(locale.value) ? locale.value : DEFAULT_LOCALE))
  const options = SUPPORTED_LOCALES.map((value) => ({
    value,
    label: LOCALE_META[value].nativeName,
    description: LOCALE_META[value].englishName,
    compactLabel: LOCALE_META[value].shortLabel,
  }))

  function changeLocale(value: string) {
    if (!isLocale(value)) return
    locale.value = value
    setStoredLocale(value)
    document.documentElement.lang = value
  }
</script>

<template>
  <BaseSelect
    :model-value="currentLocale"
    :options="options"
    :label="t('languageSelector.ariaLabel')"
    @update:model-value="changeLocale"
  />
</template>
