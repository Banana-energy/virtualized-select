<template>
  <div id="app">
    <el-button size="small" type="primary" @click="getList(5)">加载5w数据</el-button>
    <el-button size="small" type="primary" @click="getList(10)">加载10w数据</el-button>
    <el-divider />
    <el-form ref="form" :model="form">
      <el-form-item label="单选">
        <virtualized-select
          v-model="form.signal"
          :options="list"
        />
      </el-form-item>
      <el-form-item label="多选">
        <virtualized-select
          v-model="form.multiple"
          multiple
          :clearable="false"
          :options="list"
        />
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import VirtualizedSelect from './components/VirtualizedSelect.vue'

export default {
  name: 'App',
  components: {
    VirtualizedSelect
  },
  data () {
    return {
      form: {
        signal: '',
        multiple: []
      },
      list: new Array(10000 * 3).fill().map((_, index) => ({
        label: index.toString(),
        value: index
      }))
    }
  },
  methods: {
    getList (num) {
      this.list = Object.freeze(new Array(10000 * num).fill().map((_, index) => ({
        label: index.toString(),
        value: index
      })))
      this.$message.success(`加载${num}w数据成功`)
    }
  }
}
</script>

<style>
</style>
