import VirtualizedSelect from '@/components/VirtualizedSelect.vue'

const install = (Vue) => {
  Vue.component(VirtualizedSelect.name, VirtualizedSelect)
}

if (typeof window !== 'undefined' && window.Vue) {
  install(window.Vue)
}

export default {
  version: '0.0.1',
  install,
  VirtualizedSelect
}
