import ElementUi, {
  Table
} from 'element-ui'

import Mousewheel from 'element-ui/lib/directives/mousewheel'

import VirtualTableBodyRender from './virtual-table-body-render.js'

const ElTableBody = Table.components.TableBody

ElTableBody.directives = {
  Mousewheel
}

const oldDataComputed = ElTableBody.computed.data
ElTableBody.computed.data = function () {
  const { table } = this
  const tableData = oldDataComputed.call(this)

  if (table.useVirtual) {
    return tableData.slice(table.start, table.end)
  } else {
    return tableData
  }
}

const oldHoverRowHandler = ElTableBody.watch && ElTableBody.watch['store.states.hoverRow']
if (oldHoverRowHandler) {
  ElTableBody.watch['store.states.hoverRow'] = function (newVal, oldVal) {
    if (!this.table.useVirtual) {
      oldHoverRowHandler && oldHoverRowHandler.call(this, newVal, oldVal)
    }
  }
}

ElTableBody.methods.getIndex = function (index) {
  return this.table.start + index;
}

const oldGetRowClassHandler = ElTableBody.methods.getRowClass
/**
 * @description: 更新当前行的hover的类样式
 * @param {*} row
 * @param {*} rowIndex
 * @return {*}
 */
ElTableBody.methods.getRowClass  = function (row, rowIndex) {
  let classes = oldGetRowClassHandler.call(this, row, rowIndex)
  if (
    this.table.useVirtual
    && rowIndex === this.store.states.hoverRow
    && (this.table.rightFixedColumns.length || this.table.fixedColumns.length)
  ) {
    if (Object.prototype.toString.call(classes) === '[object Array]') {
      classes.push('hover-row')
    } else if (typeof classes === 'string') {
      classes += ' hover-row'
    }
  }

  return classes
}

const oldGetCellStyle = ElTableBody.methods.getCellStyle
/**
 * @description: cell style注入rowHeight变量的高度
 * @param {*} rowIndex
 * @param {*} columnIndex
 * @param {*} row
 * @param {*} column
 * @return {*}
 */
ElTableBody.methods.getCellStyle = function (rowIndex, columnIndex, row, column) {
  if (this.table.useVirtual) {
    let cellStyle = this.table.cellStyle;
    if (typeof cellStyle === 'function') {
      cellStyle = cellStyle.call(null, {
        rowIndex,
        columnIndex,
        row,
        column
      });
    }

    return cellStyle ? {
      ...cellStyle,
      height: `${this.table.rowHeight}px`
    } : { height: `${this.table.rowHeight}px` }
  } else {
    return oldGetCellStyle.call(this, rowIndex, columnIndex, row, column)
  }
}

const oldRender = ElTableBody.render
ElTableBody.render = function (h) {
  if (this.table.useVirtual) {
    return VirtualTableBodyRender.call(this, h, oldRender)
  } else {
    return oldRender.call(this, h)
  }
}
