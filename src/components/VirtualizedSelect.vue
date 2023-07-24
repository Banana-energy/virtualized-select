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
          <i v-show="!showClose" :class="['el-select__caret', 'el-input__icon', 'el-icon-' + iconClass]"/>
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
              <span v-if="optionsMap.has(item)" class="el-select__tags-text">
                {{ optionsMap.get(item)[propsValue.label] }}
              </span>
              <span v-else class="el-select__tags-text">
                {{ item }}
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
    <template #dropdown>
      <vxe-list
        v-if="filterOptions.length"
        ref="vxe-list"
        v-bind="virtualListAttrs"
        :data="filterOptions"
        :loading="loading"
      >
        <template #default="{ items }">
          <div
            v-for="item in items"
            :key="item[propsValue.value]"
            :class="{ selected: multiple ? value.includes(item[propsValue.value]) : value === item[propsValue.value] }"
            class="vxe-select-option"
            @click="handleSelect(item)"
          >
            <span>{{ item[propsValue.label] }}</span>
            <i class="el-icon-check"/>
          </div>
        </template>
      </vxe-list>
      <div v-if="noMatched" class="vxe-select-option no-match">无匹配数据</div>
      <slot v-if="!noMatched && !filterOptions.length" name="empty">
        <div class="vxe-select-option no-match">无数据</div>
      </slot>
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
    },
    virtualListProps: {
      type: Object,
      default: () => ({})
    }
  },
  data () {
    return {
      inputHovering: false,
      focused: false,
      inputShow: '',
      inputPlaceholder: '',
      inputWidth: 0,
      inputLength: 20,
      multipleQuery: '',
      initialInputHeight: 0
    }
  },
  computed: {
    hasValue () {
      const value = this.value
      return this.multiple
        ? Array.isArray(value) && value.length > 0
        : value !== undefined && value !== null && value !== ''
    },
    noMatched () {
      return (!this.multiple && !this.selected && this.hasValue)
    },
    virtualListAttrs () {
      return {
        height: 180,
        style: {
          width: this.maxOptionWidth + 'px'
        },
        ...this.virtualListProps
      }
    },
    optionsMap () {
      const map = new Map()
      const valueKey = this.propsValue.value
      this.options.forEach(option => {
        map.set(option[valueKey], option)
      })
      return Object.freeze(map)
    },
    showClose () {
      return this.clearable &&
        !this.disabled &&
        this.inputHovering &&
        this.hasValue
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
        return this.optionsMap.get(this.value)
      } else {
        return this.optionsMap.get(this.value?.[0])
      }
    },
    selectedLabel () {
      if (this.selected) {
        return this.selected[this.propsValue.label]
      }
      if (this.multiple) {
        return this.value?.[0]
      } else {
        return this.value
      }
    },
    placeholderShow () {
      if (this.multiple) {
        return this.value?.length || this.multipleQuery ? '' : this.placeholder
      } else {
        const value = this.optionsMap.get(this.value)?.[this.propsValue.label]
        return value || (this.inputShow ? this.inputShow : (this.inputPlaceholder || this.placeholder))
      }
    },
    maxOptionWidth () {
      let maxStr = ''
      const labelKey = this.propsValue.label
      this.options.forEach(option => {
        const str = option[labelKey]
        const length = str.length
        if (length > maxStr.length) {
          maxStr = str
        }
      })
      let ctx = document.createElement('canvas').getContext('2d')
      ctx.font = '14px sans-serif'
      const max = ctx.measureText(maxStr).width + (14 * 1.5 * 2)
      ctx = null
      const targetWidth = this.$refs['virtualized-select']?.$refs.content.offsetWidth
      const minWidth = parseFloat(targetWidth || 191)
      return max < minWidth ? minWidth : max
    }
  },
  watch: {
    optionsMap (val) {
      if (!this.multiple) {
        this.filterOptions = Array.isArray(this.options) ? this.options : []
        const value = val.get(this.value)?.[this.propsValue.label]
        if (this.value && !value) {
          this.inputShow = this.value
          return
        }
        this.inputShow = value || ''
      }
    },
    value: {
      handler (newVal) {
        if (!this.multiple) {
          const value = this.optionsMap.get(newVal)?.[this.propsValue.label]
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
    focused (val) {
      if (!val) {
        if (!this.multiple) {
          this.inputShow = this.value
          this.inputPlaceholder = this.placeholder
          this.filterOptions = this.options
        } else {
          this.multipleQuery = ''
          this.filterOptions = this.options
        }
      }
    }
  },
  created () {
    if (!this.multiple) {
      this.inputShow = this.value
    }
    this.filterOptions = this.options
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
      let value = this.value
      if (this.multiple) {
        this.$refs['multiple-query'].focus()
        value = this.value?.[0]
      } else {
        this.inputShow = ''
        this.inputPlaceholder = this.value
      }
      this.$refs['virtualized-select'].showPanel()
      const index = this.filterOptions.findIndex(item => item[this.propsValue.value] === value)
      if (index !== -1) {
        this.$nextTick(() => {
          this.$refs['vxe-list'].scrollTo(0, index * 36)
        })
      }
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
    },
    handleFilter () {
      const labelKey = this.propsValue.label
      const options = this.options
      if (this.multiple) {
        const query = this.multipleQuery.trim().toLowerCase()
        this.filterOptions = this.multipleQuery ? options.filter(item => item?.[labelKey]?.toLowerCase().indexOf(query) > -1) : options
      } else {
        const query = this.inputShow.trim().toLowerCase()
        this.filterOptions = this.inputShow ? options.filter(item => item?.[labelKey]?.toLowerCase().indexOf(query) > -1) : options
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
    handleClear () {
      if (this.multiple) {
        this.multipleQuery = ''
        this.filterOptions = this.options
        this.$emit('input', [])
      } else {
        this.$refs['virtualized-select'].hidePanel()
        this.focused = false
        this.inputShow = ''
        this.filterOptions = this.options
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
        this.$refs['virtualized-select'].updatePlacement()
        const inputChildNodes = this.$refs['multiple-input'].$el.childNodes
        const input = [].filter.call(inputChildNodes, item => item.tagName === 'INPUT')[0]
        const tags = this.$refs.tags
        const tagsHeight = tags ? Math.round(tags.getBoundingClientRect().height) : 0
        const sizeInMap = this.initialInputHeight || 40
        input.style.height = this.value.length === 0
          ? sizeInMap + 'px'
          : Math.max(tags ? (tagsHeight + (tagsHeight > sizeInMap ? 6 : 0)) : 0, sizeInMap
          ) + 'px'
      })
    }
  }
}
</script>

<style lang="scss" scoped>
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

  &.no-match {
    justify-content: center;
    color: #999;
    cursor: default;

    &:hover {
      background-color: transparent;
    }
  }
}

.vxe-select-option:hover {
  background-color: #f5f7fa;
}

.el-icon-check {
  display: none;
}

.selected {
  color: #409eff;
  font-weight: 700;

  > .el-icon-check {
    display: inline-block;
    font-weight: 700
  }
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
  min-height: 40px;
  border-radius: 4px;
  border: 1px solid #dadce0;
  box-shadow: 0 0 6px 2px #00000019;
  background-color: #fff;

  /*滚动条整体部分*/
  & ::-webkit-scrollbar {
    width: 8px;
    height: 10px;
    opacity: 0;

    &:hover,
    &:active,
    &:focus {
      opacity: 1;
      transition: opacity 340ms ease-out;
    }
  }

  /*滚动条的轨道*/
  & ::-webkit-scrollbar-track {
    background-color: #FFFFFF;
  }

  /*滚动条里面的小方块，能向上向下移动*/
  & ::-webkit-scrollbar-thumb {
    background-color: rgba(144, 147, 153, .3);
    transition: .3s background-color;
    border-radius: 5px;
    border: 1px solid #F1F1F1;

    &:hover {
      background-color: rgba(144, 147, 153, .5);
    }
  }

  /*边角，即两个滚动条的交汇处*/
  & ::-webkit-scrollbar-corner {
    background-color: #FFFFFF;
  }
}
</style>
