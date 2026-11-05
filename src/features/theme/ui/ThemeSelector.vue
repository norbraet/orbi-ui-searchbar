<script setup lang="ts">
  import { computed, onMounted } from 'vue'
  import { useI18n } from 'vue-i18n'
  import BaseSelect from '@/shared/components/BaseSelect/BaseSelect.vue'
  import { useThemeStore } from '@/features/theme/model/useThemeStore'
  import { isTheme } from '@/features/theme/lib/themeService'
  import { THEME_OPTIONS } from '@/features/theme/config'

  const { t } = useI18n()
  const appearance = useThemeStore()
  const options = computed(() =>
    [THEME_OPTIONS.SYSTEM, THEME_OPTIONS.LIGHT, THEME_OPTIONS.DARK].map((value) => ({
      value,
      label: t('theme.options.' + value),
    }))
  )
  onMounted(() => appearance.initializeTheme())

  function changeTheme(value: string) {
    if (isTheme(value)) appearance.setTheme(value)
  }
</script>

<template>
  <BaseSelect
    :model-value="appearance.theme"
    :options="options"
    :label="t('common.appearance')"
    @update:model-value="changeTheme"
  />
</template>
