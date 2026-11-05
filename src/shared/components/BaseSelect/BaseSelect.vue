<script setup lang="ts">
  import { computed, nextTick, ref, useId, watch } from 'vue'
  import { useFloatingPosition } from '@/shared/composables/useFloatingPosition'

  const props = defineProps<{
    modelValue: string
    label: string
    options: readonly {
      value: string
      label: string
      description?: string
      compactLabel?: string
    }[]
  }>()
  const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
  const root = ref<HTMLElement | null>(null)
  const trigger = ref<HTMLButtonElement | null>(null)
  const menu = ref<HTMLElement | null>(null)
  const isOpen = ref(false)
  const menuId = useId()
  const selected = computed(() => props.options.find((option) => option.value === props.modelValue))
  const { horizontal, vertical, updatePosition } = useFloatingPosition(root, menu, isOpen)

  function optionElements() {
    return Array.from(menu.value?.querySelectorAll<HTMLButtonElement>('[role="option"]') ?? [])
  }

  async function open(last = false) {
    if (!props.options.length) return
    isOpen.value = true
    await nextTick()
    const selectedIndex = props.options.findIndex((option) => option.value === props.modelValue)
    const index = selectedIndex >= 0 ? selectedIndex : last ? props.options.length - 1 : 0
    optionElements()[index]?.focus()
  }

  function close(restoreFocus = false) {
    isOpen.value = false
    if (restoreFocus) trigger.value?.focus()
  }

  function select(value: string) {
    emit('update:modelValue', value)
    close(true)
  }

  function onKeydown(event: KeyboardEvent) {
    const { key } = event
    if (key === 'Tab' && isOpen.value) {
      close(true)
      return
    }
    if (key === 'Escape' && isOpen.value) {
      event.preventDefault()
      event.stopPropagation()
      close(true)
      return
    }
    if (!isOpen.value) {
      if (key === 'ArrowDown' || key === 'ArrowUp') {
        event.preventDefault()
        void open(key === 'ArrowUp')
      }
      return
    }
    const options = optionElements()
    const index = options.indexOf(document.activeElement as HTMLButtonElement)
    let next = index
    if (key === 'ArrowDown') next = (index + 1) % options.length
    else if (key === 'ArrowUp') next = (index - 1 + options.length) % options.length
    else if (key === 'Home') next = 0
    else if (key === 'End') next = options.length - 1
    else if (key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey && key !== ' ') {
      // Search from the next option so repeated letters cycle through matching labels.
      const match = props.options.findIndex((_, offset) => {
        const candidate = (index + 1 + offset) % options.length
        return props.options[candidate]?.label
          .toLocaleLowerCase()
          .startsWith(key.toLocaleLowerCase())
      })
      if (match < 0) return
      next = (index + 1 + match) % options.length
    } else return
    event.preventDefault()
    options[next]?.focus()
  }

  function onFocusout(event: FocusEvent) {
    if (!root.value?.contains(event.relatedTarget as Node | null)) close()
  }

  watch(isOpen, (open, _, onCleanup) => {
    if (!open) return
    const outside = (event: PointerEvent) => {
      if (!root.value?.contains(event.target as Node)) close()
    }
    void updatePosition()
    document.addEventListener('pointerdown', outside)
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    onCleanup(() => {
      document.removeEventListener('pointerdown', outside)
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    })
  })
</script>

<template>
  <div ref="root" class="base-select" @focusout="onFocusout">
    <button
      ref="trigger"
      class="selector-trigger"
      :class="{ 'has-compact-label': selected?.compactLabel }"
      type="button"
      :aria-label="label + ': ' + (selected?.label ?? modelValue)"
      :aria-expanded="isOpen"
      aria-haspopup="listbox"
      :aria-controls="isOpen ? menuId : undefined"
      @click="isOpen ? close() : open()"
      @keydown="onKeydown"
    >
      <span class="trigger-name">{{ selected?.label ?? modelValue }}</span>
      <span v-if="selected?.compactLabel" class="trigger-compact">{{ selected.compactLabel }}</span>
      <svg
        class="trigger-icon"
        :class="{ 'is-open': isOpen }"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <path d="m4 6 4 4 4-4" />
      </svg>
    </button>
    <Transition name="menu-fade">
      <div
        v-if="isOpen"
        :id="menuId"
        ref="menu"
        class="selector-menu"
        :class="['is-' + horizontal, 'is-' + vertical]"
        role="listbox"
        tabindex="-1"
        :aria-label="label"
        @keydown="onKeydown"
      >
        <button
          v-for="option in options"
          :key="option.value"
          class="menu-item"
          :class="{ 'is-active': option.value === modelValue }"
          type="button"
          role="option"
          :aria-selected="option.value === modelValue"
          tabindex="-1"
          @click="select(option.value)"
        >
          <span class="item-primary">{{ option.label }}</span>
          <span v-if="option.description" class="item-secondary">{{ option.description }}</span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<style lang="css" scoped>
  .base-select {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: var(--space-component-xs);
  }

  .selector-trigger {
    transition: var(--motion-transition-colors);
    transition-property: background-color, border-color;
    display: inline-flex;
    align-items: center;
    gap: var(--space-component-xs);
    min-height: var(--size-control-sm);
    padding: 0 var(--space-component-sm);
    border-radius: var(--radius-button);
    border: var(--border-width-thin) solid var(--color-border);
    background-color: var(--color-surface);
    color: var(--color-text);
    font-size: var(--text-xs-size);
    font-weight: var(--text-label-weight);
    box-shadow: var(--shadow-interactive);
    font-family: inherit;
    cursor: pointer;
  }

  .selector-trigger:hover {
    background-color: var(--color-bg-subtle);
  }

  .trigger-compact {
    color: var(--color-text-muted);
    transition: var(--motion-transition-colors);
    display: none;
  }

  .trigger-name {
    transition: var(--motion-transition-colors);
    color: var(--color-text-muted);
  }

  .trigger-icon {
    display: block;
    flex-shrink: 0;
    width: var(--size-icon-xs);
    height: var(--size-icon-xs);
    color: var(--color-text-muted);
    transition:
      transform var(--motion-fast) var(--motion-ease-standard),
      var(--motion-transition-colors);
  }

  .trigger-icon.is-open {
    transform: rotate(180deg);
  }

  .selector-menu {
    transition: var(--motion-transition-colors);
    transition-property: background-color, border-color;
    position: absolute;
    min-width: min(var(--layout-menu-min-sm), calc(100vw - var(--space-component-md) * 2));
    max-width: calc(100vw - var(--space-component-md) * 2);
    max-height: 60dvh;
    padding: var(--space-component-xs);
    border-radius: var(--radius-menu);
    border: var(--border-width-thin) solid var(--color-border);
    background-color: var(--color-surface);
    box-shadow: var(--shadow-dropdown);
    z-index: var(--z-dropdown);
    display: flex;
    flex-direction: column;
    gap: var(--space-component-nano);
    overflow-y: auto;
  }

  .selector-menu.is-down {
    top: calc(100% + var(--space-component-xs));
  }

  .selector-menu.is-up {
    bottom: calc(100% + var(--space-component-xs));
  }

  .selector-menu.is-left {
    left: 0;
  }

  .selector-menu.is-right {
    right: 0;
  }

  .menu-item {
    transition: var(--motion-transition-colors);
    transition-property: background-color, border-color;
    box-sizing: border-box;
    width: 100%;
    max-width: 100%;
    height: auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-component-sm);
    padding: var(--space-component-xs) var(--space-component-sm);
    border-radius: var(--radius-button);
    border: var(--border-width-thin) solid transparent;
    background: transparent;
    white-space: normal;
    min-width: 0;
  }

  .menu-item:hover {
    background-color: var(--color-bg-subtle);
    border-color: var(--color-border);
  }

  .menu-item.is-active {
    background-color: var(--color-primary-subtle);
    border-color: var(--color-primary-subtle);
  }

  .item-primary {
    transition: var(--motion-transition-colors);
    font-size: var(--text-caption-size);
    font-weight: var(--text-label-weight);
    color: var(--color-text);
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .item-secondary {
    transition: var(--motion-transition-colors);
    font-size: var(--text-xs-size);
    color: var(--color-text-muted);
    min-width: 0;
    text-align: right;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .menu-fade-enter-active {
    transition:
      opacity var(--motion-fast) var(--motion-ease-enter),
      transform var(--motion-fast) var(--motion-ease-enter);
  }

  .menu-fade-leave-active {
    transition:
      opacity var(--motion-fast) var(--motion-ease-exit),
      transform var(--motion-fast) var(--motion-ease-exit);
  }

  .menu-fade-enter-from,
  .menu-fade-leave-to {
    opacity: 0;
    transform: translateY(calc(-1 * var(--space-component-xs)));
  }

  @media (prefers-reduced-motion: reduce) {
    .menu-fade-enter-active,
    .menu-fade-leave-active,
    .trigger-icon {
      transition: none;
    }
  }

  @media (max-width: 640px) {
    .item-secondary {
      display: none;
    }

    .has-compact-label .trigger-name {
      display: none;
    }

    .has-compact-label .trigger-compact {
      display: inline;
    }
  }
</style>
