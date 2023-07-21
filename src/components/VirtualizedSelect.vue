<template>
  <vxe-pulldown
    ref="virtualized-select"
    class="virtual-table el-select"
    transfer
    @hide-panel="focused = false"
  >
    <template v-if="!multiple" #default>
      <el-input
        :disabled="disabled"
        :placeholder="placeholderShow"
        :value="inputShow"
        @focus="handleFocus"
        @input="handleInput"
        @mouseenter.native="inputHovering = true"
        @mouseleave.native="inputHovering = false"
      >
        <template #suffix>
          <i v-show="!showClose" :class="['el-select__caret', 'el-input__icon', 'el-icon-' + iconClass]" />
          <i
            v-show="showClose"
            class="el-input__icon el-icon-circle-close"
            @click.stop="handleClear"
          />
        </template>
      </el-input>
    </template>
    <template v-else #default>
      <div class="el-select" style="width: 100%" @click.stop="handleFocus">
        <div ref="tags" :style="{width: '100%' , 'max-width': inputWidth - 62 + 'px'}" class="el-select__tags">
          <span v-if="collapseTags && value.length">
            <el-tag
              closable
              disable-transitions
              type="info"
              @close="deleteTag(0)"
            >
              <span class="el-select__tags-text">
                {{ selectedLabel }}
              </span>
            </el-tag>
            <el-tag
              v-if="value.length > 1"
              :closable="false"
              disable-transitions
              type="info"
            >
              <span class="el-select__tags-text">+ {{ value.length - 1 }}</span>
            </el-tag>
          </span>
          <transition-group v-if="!collapseTags" @after-leave="resetInputHeight">
            <el-tag v-for="(item,index) in value" :key="item" closable type="info" @close="deleteTag(index)">
              <span class="el-select__tags-text">
                {{ item && options.find(option => option[propsValue.value] === item)[propsValue.label] }}
              </span>
            </el-tag>
          </transition-group>
          <input
            ref="multiple-query"
            :disabled="disabled"
            :style="{'flex-grow': 1, width: inputLength / (inputWidth - 32) + '%', 'max-width': inputWidth - 42 + 'px'}"
            :value="multipleQuery"
            class="el-select__input"
            type="text"
            @input="handleInput"
            @keydown="resetInputState"
          >
        </div>
        <el-input
          ref="multiple-input"
          :disabled="disabled"
          :placeholder="placeholderShow"
          :value="inputShow"
          type="text"
          @change="handleInput"
          @mouseenter.native="inputHovering = true"
          @mouseleave.native="inputHovering = false"
        >
          <template #suffix>
            <i v-show="!showClose" :class="['el-select__caret', 'el-input__icon', 'el-icon-' + iconClass]"/>
            <i
              v-show="showClose"
              class="el-input__icon el-icon-circle-close"
              @click.stop="handleClear"
            />
          </template>
        </el-input>
      </div>
    </template>
    <template v-if="!filterOptions.length" #dropdown>
      <el-empty :image-size="50" description="暂无数据"/>
    </template>
    <template v-else #dropdown>
      <vxe-list
        ref="vxe-list"
        :data="filterOptions"
        :loading="loading"
        :style="{width: maxOptionWidth+'px'}"
        height="180"
      >
        <template #default="{ items }">
          <div
            v-for="item in items"
            :key="item.value"
            :class="{selected: multiple ? value.includes(item[propsValue.value]) : value === item[propsValue.value] }"
            class="vxe-select-option"
            @click="handleSelect(item)"
          >
            <span>{{ item[propsValue.label] }}</span>
            <i
              v-show="multiple ? value.includes(item[propsValue.value]) : value === item[propsValue.value]"
              class="el-icon-check"
              style="font-weight: 700"
            />
          </div>
        </template>
      </vxe-list>
    </template>
  </vxe-pulldown>
</template>

<script>
import { addResizeListener, removeResizeListener } from 'element-ui/src/utils/resize-event'

export default {
  name: 'VirtualizedSelect',
  props: {
    value: {
      type: [String, Number, Array],
      default: ''
    },
    options: {
      type: Array,
      default: () => []
    },
    disabled: {
      type: Boolean,
      default: false
    },
    placeholder: {
      type: String,
      default: '请选择'
    },
    multiple: {
      type: Boolean,
      default: false
    },
    clearable: {
      type: Boolean,
      default: true
    },
    valueKey: {
      type: String,
      default: ''
    },
    props: {
      type: Object,
      default: () => ({
        label: 'label',
        value: 'value'
      })
    },
    loading: {
      type: Boolean,
      default: false
    },
    collapseTags: {
      type: Boolean,
      default: false
    },
    reserveKeyword: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      inputHovering: false,
      focused: false,
      inputShow: '',
      inputWidth: 0,
      inputLength: 20,
      multipleQuery: '',
      filterOptions: this.options,
      initialInputHeight: 0
    }
  },
  computed: {
    showClose () {
      const hasValue = this.multiple
        ? Array.isArray(this.value) && this.value.length > 0
        : this.value !== undefined && this.value !== null && this.value !== ''
      return this.clearable &&
        !this.disabled &&
        this.inputHovering &&
        hasValue
    },
    iconClass () {
      return this.focused ? 'arrow-up is-reverse' : 'arrow-up'
    },
    propsValue () {
      return {
        ...this.props,
        value: this.props.value || 'value',
        label: this.props.label || 'label'
      }
    },
    selected () {
      if (!this.multiple) {
        return this.options.find(option => option[this.propsValue.value] === this.value)
      } else {
        return this.options.find(option => option[this.propsValue.value] === this.value?.[0])
      }
    },
    selectedLabel () {
      return this.selected?.[this.propsValue.label] || '无匹配项'
    },
    placeholderShow () {
      if (this.multiple) {
        return this.value?.length || this.multipleQuery ? '' : this.placeholder
      } else {
        const value = this.options.find(option => option[this.propsValue.value] === this.value)?.[this.propsValue.label]
        return value || (this.inputShow ? '' : this.placeholder)
      }
    },
    maxOptionWidth () {
      let maxStr = ''
      this.options.forEach(option => {
        const str = option[this.propsValue.label]
        const length = str.length
        if (length > maxStr.length) {
          maxStr = str
        }
      })
      let ctx = document.createElement('canvas').getContext('2d')
      ctx.font = '14px sans-serif'
      const max = ctx.measureText(maxStr).width + 20
      ctx = null
      const minWidth = parseFloat(this.$refs['virtualized-select']?.panelStyle?.minWidth || 191)
      return max < minWidth ? minWidth : max
    }
  },
  watch: {
    options (val) {
      this.filterOptions = Array.isArray(val) ? val : []
      const value = val.find(option => option[this.propsValue.value] === this.value)?.[this.propsValue.label]
      this.inputShow = value || ''
    },
    value: {
      handler (newVal) {
        if (!this.multiple) {
          const value = this.options.find(option => option[this.propsValue.value] === newVal)?.[this.propsValue.label]
          this.inputShow = value || ''
          this.inputLength = 20
          return
        }
        this.resetInputHeight()
        if (this.multiple && Array.isArray(newVal) && newVal.length && newVal[0] === undefined) {
          this.$emit('input', [])
        }
      },
      deep: true
    },
    filterOptions () {
      this.$refs['virtualized-select']?.updatePlacement()
    }
  },
  mounted () {
    addResizeListener(this.$el, this.handleResize)
    const reference = this.$refs['multiple-input']
    if (reference && reference.$el) {
      const input = reference.$el.querySelector('input')
      this.initialInputHeight = input.getBoundingClientRect().height
    }
    this.$nextTick(() => {
      if (reference && reference.$el) {
        this.inputWidth = reference.$el.getBoundingClientRect().width
      }
    })
  },
  beforeDestroy () {
    if (this.$el && this.handleResize) removeResizeListener(this.$el, this.handleResize)
  },
  methods: {
    handleFocus () {
      if (this.disabled) {
        return
      }
      if (this.multiple) {
        this.$refs['multiple-query'].focus()
      }
      this.$refs['virtualized-select'].showPanel()
      this.focused = true
    },
    handleSelect (item) {
      const value = item[this.propsValue.value]
      const label = item[this.propsValue.label]
      if (this.multiple) {
        let arr = []
        const index = this.value.indexOf(value)
        if (index === -1) {
          arr = [...this.value, value]
          this.$emit('input', arr)
        } else {
          arr = [...this.value]
          arr.splice(index, 1)
          this.$emit('input', arr)
        }
        if (!this.reserveKeyword) {
          this.filterOptions = this.options
          this.multipleQuery = ''
        }
      } else {
        this.inputShow = label
        this.$emit('input', value)
        this.focused = false
        this.$refs['virtualized-select'].hidePanel()
      }
      // this.filterOptions = this.options
      // this.multipleQuery = ''
    },
    handleFilter () {
      if (this.multiple) {
        this.filterOptions = this.multipleQuery ? this.options.filter(item => item?.[this.propsValue.label]?.toLowerCase().indexOf(this.multipleQuery.trim().toLowerCase()) > -1) : this.options
      } else {
        this.filterOptions = this.inputShow ? this.options.filter(item => item?.[this.propsValue.label]?.toLowerCase().indexOf(this.inputShow.trim().toLowerCase()) > -1) : this.options
      }
    },
    handleInput (e) {
      const value = e?.target?.value ?? e
      if (this.multiple) {
        this.$nextTick(() => {
          this.inputLength = this.$refs['multiple-query'].value.length * 15 + 20
          this.resetInputHeight()
        })
        this.multipleQuery = value
      } else {
        this.inputShow = value
      }
      this.handleFilter()
    },
    deleteTag (index) {
      const value = [...this.value]
      value.splice(index, 1)
      this.$emit('input', value)
    },
    handleClear (e) {
      if (this.multiple) {
        this.multipleQuery = ''
        this.filterOptions = this.options
        this.$emit('input', [])
      } else {
        this.$emit('input', '')
      }
    },
    handleResize () {
      if (this.multiple) {
        this.resetInputWidth()
        this.resetInputHeight()
      }
    },
    resetInputWidth () {
      this.inputWidth = this.$refs['multiple-input'].$el.getBoundingClientRect().width
    },
    resetInputState () {
      this.inputLength = this.$refs['multiple-query'].value.length * 15 + 20
      this.resetInputHeight()
    },
    resetInputHeight () {
      this.$nextTick(() => {
        if (!this.$refs['multiple-input']) return
        const inputChildNodes = this.$refs['multiple-input'].$el.childNodes
        const input = [].filter.call(inputChildNodes, item => item.tagName === 'INPUT')[0]
        const tags = this.$refs.tags
        const tagsHeight = tags ? Math.round(tags.getBoundingClientRect().height) : 0
        const sizeInMap = this.initialInputHeight || 40
        input.style.height = this.value.length === 0
          ? sizeInMap + 'px'
          : Math.max(
            tags ? (tagsHeight + (tagsHeight > sizeInMap ? 6 : 0)) : 0,
            sizeInMap
          ) + 'px'
      })
    }
  }
}
</script>

<style scoped>
.vxe-select-option {
  cursor: pointer;
  color: #606266;
  height: 36px;
  line-height: 36px;
  padding: 0 1.5em;
  font-size: 14px;
  font-variant: tabular-nums;
  font-feature-settings: "tnum";
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.vxe-select-option:hover {
  background-color: #f5f7fa;
}

.selected {
  color: #409eff;
  font-weight: 700;
}

.loading {
  width: 100%;
  padding: 10px 0;
  text-align: center;
  color: #999;
  font-size: 14px;
}

::v-deep .el-input__suffix {
  display: flex;
  align-items: center;
}

</style>

<style lang="scss">
.vxe-pulldown--wrapper {
  width: 100%;
  position: relative;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 4px 0;
  max-height: 200px;
  min-height: 40px;
  border-radius: 4px;
  border: 1px solid #dadce0;
  box-shadow: 0 0 6px 2px #00000019;
  background-color: #fff;

  .el-empty {
    padding: 10px 0;
  }

  /*滚动条整体部分*/
  & ::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }

  /*滚动条的轨道*/
  & ::-webkit-scrollbar-track {
    background-color: #FFFFFF;
  }

  /*滚动条里面的小方块，能向上向下移动*/
  & ::-webkit-scrollbar-thumb {
    background-color: #E1E1E1AD;
    border-radius: 5px;
    border: 1px solid #F1F1F1;
    box-shadow: inset 0 0 6px #0000004C;
  }

  & ::-webkit-scrollbar-thumb:hover {
    background-color: #E1E1E1E0;
  }

  & ::-webkit-scrollbar-thumb:active {
    background-color: #E1E1E1FF;
  }

  /*边角，即两个滚动条的交汇处*/
  & ::-webkit-scrollbar-corner {
    background-color: #FFFFFF;
  }
}
</style>
