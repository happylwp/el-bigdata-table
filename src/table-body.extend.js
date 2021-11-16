import ElementUi, {
  Table
} from 'element-ui'

import Mousewheel from 'element-ui/lib/directives/mousewheel'

import VirtualTableBodyRender from './virtual-table-body-render.js'

function trans (version) {
  const versionNums = version.toString().split('.')
  let result = Array.from({ length: 3 })

  result = result.map((_, idx) => {
    const num = versionNums[idx]

    if (!num) {
      return '00'
    } else {
      return +num < 10 ? `0${num}` : num
    }
  }).join('')

  return +result
}

const newVersion = trans(ElementUi.version) >= trans(2.8)

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
ElTableBody.methods.getRowClass  = function (row, rowIndex) {
  let classes = oldGetRowClassHandler.call(this, row, rowIndex)

  if (
    this.table.useVirtual
    && rowIndex === this.store.states.hoverRow
    && (this.table.rightFixedColumns.length || this.table.fixedColumns.length)
  ) {
    // 兼容element-ui低版本
    if (newVersion && Object.prototype.toString.call(classes) === '[object Array]') {
      classes.push('hover-row')
    } else if (typeof classes === 'string') {
      classes += ' hover-row'
    }
  }

  return classes
}

ElTableBody.methods.isRenderCell = function (column, cellIndex) {
  const { table } = this
  const isFixedColumn = column.fixed
  const isFixedColumnInSideFixedBody = isFixedColumn && this.fixed
  const isInVisibleArea = cellIndex >= table.columnStart && cellIndex <= table.columnEnd

  return table.useVirtualColumn ? isInVisibleArea || isFixedColumnInSideFixedBody : !isFixedColumn || isFixedColumnInSideFixedBody
}

const oldRowRender = ElTableBody.methods.rowRender
ElTableBody.methods.rowRender = function (row, $index, treeRowData) {
  const h = this.$createElement
  if (this.table.useVirtual) {
    const { treeIndent, columns, firstDefaultColumnIndex } = this;
    const columnsHidden = columns.map((column, index) => this.isColumnHidden(index));
    const rowClasses = this.getRowClass(row, $index);
    const rowKey = this.table.useRowKey ? (this.table.rowKey ? this.getKeyOfRow(row, $index) : $index) : null;
    let display = true;
    if (treeRowData) {
      rowClasses.push('el-table__row--level-' + treeRowData.level);
      display = treeRowData.display;
    }
    // 指令 v-show 会覆盖 row-style 中 display
    // 使用 :style 代替 v-show https://github.com/ElemeFE/element/issues/16995
    let displayStyle = display ? null : {
      display: 'none'
    };

    return (<tr
      style={ [displayStyle, this.getRowStyle(row, $index)] }
      class={ rowClasses }
      key={ rowKey }
      on-dblclick={ ($event) => this.handleDoubleClick($event, row) }
      on-click={ ($event) => this.handleClick($event, row) }
      on-contextmenu={ ($event) => this.handleContextMenu($event, row) }
      on-mouseenter={ _ => this.handleMouseEnter($index) }
      on-mouseleave={ this.handleMouseLeave }>
      {
        columns.map((column, cellIndex) => {
          const { rowspan, colspan } = this.getSpan(row, column, $index, cellIndex);
          if (!rowspan || !colspan) {
            return null;
          }
          const columnData = { ...column };
          columnData.realWidth = this.getColspanRealWidth(columns, colspan, cellIndex);
          const data = {
            store: this.store,
            _self: this.context || this.table.$vnode.context,
            column: columnData,
            row,
            $index
          };
          if (cellIndex === firstDefaultColumnIndex && treeRowData) {
            data.treeNode = {
              indent: treeRowData.level * treeIndent,
              level: treeRowData.level
            };
            if (typeof treeRowData.expanded === 'boolean') {
              data.treeNode.expanded = treeRowData.expanded;
              // 表明是懒加载
              if ('loading' in treeRowData) {
                data.treeNode.loading = treeRowData.loading;
              }
              if ('noLazyChildren' in treeRowData) {
                data.treeNode.noLazyChildren = treeRowData.noLazyChildren;
              }
            }
          }
          return (
            <td
              style={ [{height: this.table.rowHeight + 'px'}, this.getCellStyle($index, cellIndex, row, column)] }
              class={ this.getCellClass($index, cellIndex, row, column) }
              rowspan={ rowspan }
              colspan={ colspan }
              on-mouseenter={ ($event) => this.handleCellMouseEnter($event, row) }
              on-mouseleave={ this.handleCellMouseLeave }>
              {
                this.isRenderCell(column, cellIndex) && column.renderCell.call(
                  this._renderProxy,
                  this.$createElement,
                  data,
                  columnsHidden[cellIndex]
                )
              }
            </td>
          );
        })
      }
    </tr>);
  } else {
    return oldRowRender.call(this, row, $index, treeRowData)
  }
}

const oldRender = ElTableBody.render
ElTableBody.render = function (h) {
  if (this.table.useVirtual) {
    return VirtualTableBodyRender.call(this, h)
  } else {
    return oldRender.call(this, h)
  }
}
