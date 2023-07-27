<template>
  <div id="app">
    <el-button size="small" type="primary" @click="getList(5)">加载5w数据</el-button>
    <el-button size="small" type="primary" @click="getList(10)">加载10w数据</el-button>
    <el-divider />
    <el-form ref="form" :model="form">
      <el-form-item label="ElSelect">
        <el-select
          v-model="form.multiple"
          clearable
          multiple
          filterable
          value-key="value"
        >
          <el-option v-for="item in 10" :key="item" :value="{label:item,value:item}" :label="item"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="单选">
        <virtualized-select
          v-model="form.signal"
          :options="list"
          value-key="value"
        />
      </el-form-item>
      <el-form-item label="多选">
        <virtualized-select
          v-model="form.multiple"
          multiple
          :options="list"
          :virtual-list-props="{ height: 300 }"
          reserve-keyword
          value-key="value"
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
        signal: {
          label: '1',
          value: 1
        },
        multiple: ['213ce']
      },
      list: Object.freeze(new Array(10000 * 3).fill().map((_, index) => ({
        label: index.toString(),
        value: index
      })))
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
