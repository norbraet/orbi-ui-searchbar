import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import BaseSelect from './BaseSelect.vue'

const meta = {
  title: 'Shared/BaseSelect',
  component: BaseSelect,
  tags: ['autodocs'],
  args: {
    label: 'Size',
    modelValue: 'medium',
    options: [
      { value: 'small', label: 'Small' },
      { value: 'medium', label: 'Medium' },
      { value: 'large', label: 'Large' },
    ],
  },
  render: (args) => ({
    components: { BaseSelect },
    setup() {
      const value = ref(args.modelValue)
      return { args, value }
    },
    template: '<BaseSelect v-bind="args" v-model="value" />',
  }),
} satisfies Meta<typeof BaseSelect>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Descriptions: Story = {
  args: {
    label: 'Language',
    modelValue: 'en',
    options: [
      { value: 'en', label: 'English', description: 'English', compactLabel: 'EN' },
      { value: 'de', label: 'Deutsch', description: 'German', compactLabel: 'DE' },
    ],
  },
}
