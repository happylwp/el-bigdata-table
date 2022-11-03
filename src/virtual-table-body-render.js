export default function render(h, oldRender) {
  return (
    <div
      style={[{height: `${this.table.virtualBodyHeight}px`}]}
      class={['el-table__virtual-wrapper', {'el-table--fixed__virtual-wrapper': this.fixed}]}
      v-mousewheel={this.table.handleFixedMousewheel}
    >
      <div style={[{transform: `translateY(${this.table.innerTop}px)`}]}>
      {
        oldRender.call(this, h)
      }
      </div>
    </div>
  );
}
