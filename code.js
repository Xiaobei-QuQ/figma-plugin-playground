import { extractLinearGradientParamsFromTransform } from '@figma-plugin/helpers'

figma.showUI(__html__)

figma.ui.onmessage = async ({ id, type, payload = {} }) => {
  try {
    const selection = figma.currentPage.selection
    const node = selection[0]
    if (node.fills.length) {
      console.log('no fill', node.fills)
      const fill = node.fills[0]
      console.log(extractLinearGradientParamsFromTransform, 'extractLinearGradientParamsFromTransform')
      const { start: startRatio, end: endRatio } = extractLinearGradientParamsFromTransform(1, 1, fill.gradientTransform)
      console.log(22, { startRatio, endRatio })
      const gradientHandlePositions = [
        { x: startRatio[0], y: startRatio[1] },
        { x: endRatio[0], y: endRatio[1] },
        { x: 0, y: 0 },
      ]

      // 获取渐变句柄起点坐标
      const start = [gradientHandlePositions[0].x * node.width, gradientHandlePositions[0].y * node.height]
      // 获取渐变句柄终点坐标
      const end = [gradientHandlePositions[1].x * node.width, gradientHandlePositions[1].y * node.height]
      // 计算渐变角度
      const deltaX = end[0] - start[0]
      const deltaY = end[1] - start[1]
      const angleInRadians = Math.atan2(deltaY, deltaX)
      const angleInDegrees = angleInRadians * (180 / Math.PI)
      const unadjustedAngle = angleInDegrees >= 0 ? angleInDegrees : angleInDegrees + 360
      const angle = unadjustedAngle + 90
      console.log(11, { angle })
    }
  } catch (error) {
    console.log(error)
  }
}
