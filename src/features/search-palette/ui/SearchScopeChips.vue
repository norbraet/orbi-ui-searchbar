<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
  import type { SearchPaletteLabels, SearchScope } from '@/features/search-palette/types'

  const props = defineProps<{
    scopes: readonly SearchScope[]
    selectedId: string | null
    counts: Readonly<Record<string, number>>
    showCounts: boolean
    labels: SearchPaletteLabels
  }>()
  const emit = defineEmits<{ select: [id: string | null] }>()
  const allScopeKey = Symbol('all-content')
  const chips = computed(() => [{ id: null, label: props.labels.allScopes }, ...props.scopes])
  const rail = ref<HTMLElement | null>(null)
  let observer: ResizeObserver | undefined
  defineExpose({
    contains: (element: Element | null) => Boolean(element && rail.value?.contains(element)),
  })

  function revealChip(button: HTMLButtonElement) {
    const container = rail.value
    if (!container) return
    const bounds = container.getBoundingClientRect()
    const item = button.getBoundingClientRect()
    const style = getComputedStyle(container)
    const left = bounds.left + parseFloat(style.paddingLeft)
    const right = bounds.right - parseFloat(style.paddingRight)
    if (item.left < left) container.scrollLeft += item.left - left
    else if (item.right > right) container.scrollLeft += item.right - right
  }

  function revealCurrentChip() {
    const container = rail.value
    if (!container) return
    const focused = container.ownerDocument.activeElement
    const button =
      focused instanceof HTMLButtonElement && container.contains(focused)
        ? focused
        : container.querySelector<HTMLButtonElement>('button[aria-pressed="true"]')
    if (button) revealChip(button)
  }

  watch(() => [props.selectedId, props.counts, props.showCounts, props.scopes], revealCurrentChip, {
    flush: 'post',
  })
  onMounted(() => {
    observer = new ResizeObserver(revealCurrentChip)
    observer.observe(rail.value!)
    // ResizeObserver can coalesce rapid viewport changes back to the same width.
    window.addEventListener('resize', revealCurrentChip)
  })
  onBeforeUnmount(() => {
    observer?.disconnect()
    window.removeEventListener('resize', revealCurrentChip)
  })

  function onKeydown(event: KeyboardEvent) {
    if (
      event.isComposing ||
      event.keyCode === 229 ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey
    )
      return
    const buttons = [...(rail.value?.querySelectorAll<HTMLButtonElement>('button') ?? [])]
    const index = buttons.indexOf(event.currentTarget as HTMLButtonElement)
    let target: HTMLButtonElement | undefined
    if (event.key === 'Home') target = buttons[0]
    else if (event.key === 'End') target = buttons[buttons.length - 1]
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      const rtl = getComputedStyle(rail.value!).direction === 'rtl'
      const direction = (event.key === 'ArrowRight') !== rtl ? 1 : -1
      target =
        buttons[index + direction] ?? (direction === 1 ? buttons[0] : buttons[buttons.length - 1])
    }
    if (!target) return
    event.preventDefault()
    target.focus({ preventScroll: true })
  }
</script>

<template>
  <div ref="rail" class="search-palette-scopes" role="group" :aria-label="labels.scopes">
    <button
      v-for="scope in chips"
      :key="scope.id ?? allScopeKey"
      class="search-palette-scope"
      type="button"
      :aria-pressed="selectedId === scope.id"
      @mousedown.prevent
      @click="emit('select', scope.id)"
      @keydown="onKeydown"
      @focus="revealCurrentChip"
    >
      <span class="search-palette-scope-check" aria-hidden="true">✓</span>
      <span>{{ scope.label }}</span>
      <span
        v-if="scope.id !== null && counts[scope.id] !== undefined"
        class="search-palette-scope-count"
        :data-hidden="!showCounts"
        :aria-hidden="!showCounts"
        >{{ counts[scope.id] }}</span
      >
    </button>
  </div>
</template>
