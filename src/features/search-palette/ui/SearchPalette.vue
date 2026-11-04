<script setup lang="ts">
  import {
    computed,
    nextTick,
    onBeforeUnmount,
    onMounted,
    ref,
    shallowRef,
    useId,
    watch,
  } from 'vue'
  import type { VNode } from 'vue'
  import { useSearchPalette } from '@/features/search-palette/model/useSearchPalette'
  import { searchPaletteLabels } from '@/features/search-palette/i18n/en'
  import SearchPaletteContent from './SearchPaletteContent.vue'
  import type {
    SearchContext,
    SearchPaletteLabels,
    SearchResult,
    SearchService,
  } from '@/features/search-palette/types'
  import '../style.css'

  const props = withDefaults(
    defineProps<{
      search: SearchService
      context?: SearchContext
      labels?: Partial<SearchPaletteLabels>
      debounceMs?: number
      /** false disables the shortcut; otherwise use Cmd/Ctrl plus this character. */
      shortcut?: string | false
    }>(),
    { debounceMs: 180, shortcut: 'k' }
  )
  const isOpen = defineModel<boolean>('open', { default: false })
  const emit = defineEmits<{ activate: [result: SearchResult] }>()
  const slots = defineSlots<{
    result?(props: { result: SearchResult; selected: boolean }): VNode[]
    preview?(props: { result: SearchResult }): VNode[]
  }>()

  const palette = useSearchPalette({
    search: (request) => props.search(request),
    context: () => props.context,
    debounceMs: props.debounceMs,
  })
  const { state, selectedResult } = palette
  const labels = computed(() => ({ ...searchPaletteLabels, ...props.labels }))
  const dialog = ref<HTMLDialogElement | null>(null)
  const content = ref<InstanceType<typeof SearchPaletteContent> | null>(null)
  const titleId = useId()
  const phase = ref<'idle' | 'opening' | 'closing'>('idle')
  // Freeze only presentation during exit; the headless model cancels work immediately.
  const exitSnapshot = shallowRef<{
    state: typeof state
    selectedResult: typeof selectedResult.value
  } | null>(null)
  const visibleState = computed(() => exitSnapshot.value?.state ?? state)
  const visibleResult = computed(() => exitSnapshot.value?.selectedResult ?? selectedResult.value)
  let motionId = 0
  let opener: HTMLElement | null = null
  let pointerOpener: HTMLElement | null = null
  let lastPointerTime = -Infinity
  let lastCompositionEnd = -Infinity
  let isComposing = false

  function startComposition() {
    isComposing = true
  }

  function endComposition() {
    isComposing = false
    lastCompositionEnd = performance.now()
  }

  function onNativeClose() {
    if (!dialog.value?.open) isOpen.value = false
  }

  function rememberPointerOpener(event: PointerEvent) {
    if (!(event.target instanceof Element) || dialog.value?.contains(event.target)) return
    pointerOpener = event.target.closest<HTMLElement>(
      'button, a[href], input, select, textarea, [tabindex]'
    )
    lastPointerTime = performance.now()
  }

  function activate(id?: string) {
    const result = palette.activate(id)
    if (!result) return
    isOpen.value = false
    emit('activate', result)
  }

  async function syncDialog() {
    const element = dialog.value
    if (!element) return
    const id = ++motionId
    if (isOpen.value) {
      exitSnapshot.value = null
      phase.value = 'opening'
      palette.open()
      if (!element.open) {
        opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
        // Safari does not focus buttons on click, so activeElement may still be body.
        if ((!opener || opener === document.body) && performance.now() - lastPointerTime < 500) {
          opener = pointerOpener
        }
        element.showModal()
      }
      await nextTick()
      if (isOpen.value) content.value?.focusInput()
    } else {
      if (element.open) {
        exitSnapshot.value = { state: { ...state }, selectedResult: selectedResult.value }
      }
      palette.close()
      if (element.open) {
        phase.value = 'closing'
        await nextTick()
        if (id !== motionId) return
        // Follow actual CSS duration, including overrides and reduced-motion preferences.
        await Promise.allSettled(element.getAnimations().map((animation) => animation.finished))
        if (id !== motionId) return
        element.close()
      }
      phase.value = 'idle'
      exitSnapshot.value = null
      if (opener?.isConnected) opener.focus()
      opener = null
    }
  }

  function onShortcut(event: KeyboardEvent) {
    if (
      !props.shortcut ||
      event.defaultPrevented ||
      event.repeat ||
      event.isComposing ||
      isComposing ||
      event.keyCode === 229
    )
      return
    if (event.altKey || event.shiftKey || !(event.metaKey || event.ctrlKey)) return
    if (event.key.toLowerCase() !== props.shortcut.toLowerCase()) return
    // Do not steal a shortcut from another native modal or a second palette.
    const modal = document.querySelector('dialog[open]')
    if (modal && modal !== dialog.value) return
    event.preventDefault()
    isOpen.value = !isOpen.value
  }

  function onCancel(event: Event) {
    event.preventDefault()
    // Escape used to dismiss an IME candidate window must not dismiss search.
    if (isComposing || performance.now() - lastCompositionEnd < 100) return
    isOpen.value = false
  }

  function onDialogKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      if (
        event.isComposing ||
        isComposing ||
        event.keyCode === 229 ||
        performance.now() - lastCompositionEnd < 100
      )
        return
      event.preventDefault()
      event.stopPropagation()
      isOpen.value = false
    }
    if (event.key !== 'Tab' || !dialog.value) return
    const controls = [
      ...dialog.value.querySelectorAll<HTMLElement>(
        'button, input, select, textarea, a[href], [tabindex], [contenteditable="true"]'
      ),
    ].filter(
      (element) =>
        element.tabIndex >= 0 &&
        !element.matches(':disabled') &&
        element.getClientRects().length &&
        getComputedStyle(element).visibility !== 'hidden'
    )
    const first = controls[0]
    const last = controls[controls.length - 1]
    if (!first || !last) return
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  watch(isOpen, syncDialog, { flush: 'post' })
  onMounted(() => {
    document.addEventListener('keydown', onShortcut)
    document.addEventListener('pointerdown', rememberPointerOpener, true)
    void syncDialog()
  })
  onBeforeUnmount(() => {
    motionId += 1
    document.removeEventListener('keydown', onShortcut)
    document.removeEventListener('pointerdown', rememberPointerOpener, true)
    dialog.value?.getAnimations().forEach((animation) => animation.cancel())
    dialog.value?.close()
    if (opener?.isConnected) opener.focus()
  })
</script>

<template>
  <!-- Native modal dialogs handle Escape and Tab without adopting a widget role. -->
  <!-- eslint-disable-next-line vuejs-accessibility/no-static-element-interactions -->
  <dialog
    ref="dialog"
    class="search-palette"
    :data-phase="phase"
    :inert="phase === 'closing'"
    :aria-labelledby="titleId"
    aria-modal="true"
    @cancel="onCancel"
    @keydown="onDialogKeydown"
    @close="onNativeClose"
    @compositionstart="startComposition"
    @compositionend="endComposition"
  >
    <h2 :id="titleId" class="search-palette-sr-only">{{ labels.title }}</h2>
    <SearchPaletteContent
      ref="content"
      :query="visibleState.query"
      :status="visibleState.status"
      :results="visibleState.results"
      :suggestions="visibleState.suggestions"
      :selected-id="visibleState.selectedId"
      :selected-result="visibleResult"
      :labels="labels"
      @query="palette.setQuery"
      @select="palette.select"
      @move="palette.moveSelection"
      @activate="activate"
      @retry="palette.retry"
      @dismiss="isOpen = false"
    >
      <template v-for="(_, name) in slots" #[name]="slotProps">
        <slot
          :name="name"
          v-bind="slotProps"
          :selected="'selected' in slotProps ? slotProps.selected : false"
        />
      </template>
    </SearchPaletteContent>
  </dialog>
</template>
