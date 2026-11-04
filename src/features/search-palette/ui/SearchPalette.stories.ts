import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import SearchPalette from './SearchPalette.vue'
import { createMockSearchService } from '../mocks'

const meta = {
  title: 'Features/SearchPalette',
  component: SearchPalette,
  tags: ['autodocs'],
  args: { search: createMockSearchService(), shortcut: false },
  render: (args) => ({
    components: { SearchPalette },
    setup() {
      const open = ref(false)
      return { args, open }
    },
    template:
      '<button type="button" @click="open = true">Open search</button><SearchPalette v-bind="args" v-model:open="open" />',
  }),
} satisfies Meta<typeof SearchPalette>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Open search' }))
    const input = await canvas.findByRole('combobox', { name: 'Search' })
    await expect(input).toHaveFocus()
    await canvas.findByRole('option', { name: /Search behavior and presentation/ })
    await userEvent.keyboard('{ArrowDown}')
    await waitFor(() =>
      expect(canvas.getByRole('heading', { name: 'Designing with materials' })).toBeVisible()
    )
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Open search' })).toHaveFocus())
  },
}
export const Empty: Story = { args: { search: createMockSearchService('empty') } }
export const Error: Story = { args: { search: createMockSearchService('error') } }
export const Loading: Story = { args: { search: createMockSearchService('slow') } }
export const MissingPreview: Story = { args: { search: createMockSearchService('no-preview') } }
export const CustomSlots: Story = {
  render: (args) => ({
    components: { SearchPalette },
    setup() {
      return { args, open: ref(false) }
    },
    template: `
      <button type="button" @click="open = true">Open search</button>
      <SearchPalette v-bind="args" v-model:open="open">
        <template #result="{ result, selected }">
          <strong>{{ selected ? 'Selected: ' : '' }}{{ result.title }}</strong>
        </template>
        <template #preview="{ result }">
          <h3>Details: {{ result.title }}</h3>
        </template>
      </SearchPalette>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Open search' }))
    await canvas.findByRole('option', { name: 'Selected: Search behavior and presentation' })
    await userEvent.keyboard('{ArrowDown}')
    await expect(
      canvas.getByRole('option', { name: 'Selected: Designing with materials' })
    ).toHaveAttribute('aria-selected', 'true')
    await waitFor(() =>
      expect(
        canvas.getByRole('heading', { name: 'Details: Designing with materials' })
      ).toBeVisible()
    )
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Open search' })).toHaveFocus())
  },
}
export const Dark: Story = {
  decorators: [() => ({ template: '<div data-theme="dark"><story /></div>' })],
}
