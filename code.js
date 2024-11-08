import { extractLinearGradientParamsFromTransform } from '@figma-plugin/helpers'

/**
 * 四舍五入
 * @param num 数字
 * @param decimalPlaces 小数点后几位
 * @returns
 */
export function round(num, decimalPlaces) {
  return parseFloat(num.toFixed(decimalPlaces))
}

// 数字转换
export const numToAutoFixed = (num) => {
  return num.toFixed(2).replace(/\.00$/, '')
}
/**
 * 获取颜色的html代码
 * @param color 颜色
 * @param alpha 透明度
 * @returns 颜色的html代码
 */
export const htmlColor = (color, alpha = 1) => {
  if (color.r === 1 && color.g === 1 && color.b === 1 && alpha === 1) {
    return 'white'
  }

  if (color.r === 0 && color.g === 0 && color.b === 0 && alpha === 1) {
    return 'black'
  }

  if (alpha === 1) {
    const r = Math.round(color.r * 255)
    const g = Math.round(color.g * 255)
    const b = Math.round(color.b * 255)

    const toHex = (num) => num.toString(16).padStart(2, '0')
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase()
  }

  const r = numToAutoFixed(color.r * 255)
  const g = numToAutoFixed(color.g * 255)
  const b = numToAutoFixed(color.b * 255)
  const a = numToAutoFixed(alpha)

  return `rgba(${r}, ${g}, ${b}, ${a})`
}

/**
 * 旋转元素
 * @param cx 旋转中心点x坐标
 * @param cy 旋转中心点y坐标
 * @param x 元素x坐标
 * @param y 元素y坐标
 * @param angle 旋转角度
 * @returns 旋转后的元素坐标
 */
export function rotate(cx, cy, x, y, angle) {
  var radians = (Math.PI / 180) * angle,
    cos = Math.cos(radians),
    sin = Math.sin(radians),
    nx = cos * (x - cx) + sin * (y - cy) + cx,
    ny = cos * (y - cy) - sin * (x - cx) + cy
  return [nx, ny]
}

/**
 * 旋转椭圆
 * @param cx 旋转中心点x坐标
 * @param cy 旋转中心点y坐标
 * @param xRadius 椭圆x半径
 * @param yRadius 椭圆y半径
 * @param angle 旋转角度
 * @param rotationFactor 旋转因子
 * @returns 旋转后的椭圆坐标
 */
export function rotateElipse(cx, cy, xRadius, yRadius, angle, rotationFactor) {
  // rotates points[x, y] some degrees about an origin [cx, cy]
  xRadius = xRadius * 1.5
  yRadius = yRadius * 1.5

  const normalizedRotationFactor = rotationFactor / 57.29577951
  const cosAngle = Math.cos((Math.PI / 180) * (angle + 180))
  const sinAngle = Math.sin((Math.PI / 180) * (angle + 180))
  const x = -xRadius * Math.cos(normalizedRotationFactor) * cosAngle - yRadius * Math.sin(normalizedRotationFactor) * sinAngle + cx
  const y = -yRadius * Math.cos(normalizedRotationFactor) * sinAngle + xRadius * Math.sin(normalizedRotationFactor) * cosAngle + cy
  return [x, y]
}

/**
 * 获取一个元素的四个角坐标，即使元素被旋转
 * @param node 元素
 * @param elemRotation 元素旋转角度
 * @returns 四个角坐标
 */
export function getCorners(node, elemRotation) {
  const topLeft = [node.relativeTransform[0][2], node.relativeTransform[1][2]]
  const topRight = rotate(topLeft[0], topLeft[1], topLeft[0] + node.width, topLeft[1], -elemRotation)
  const bottomRight = rotate(topRight[0], topRight[1], topRight[0], topRight[1] + node.height, -elemRotation)
  const bottomLeft = rotate(bottomRight[0], bottomRight[1], bottomRight[0] - node.width, bottomRight[1], -elemRotation)
  return {
    topLeft: topLeft,
    topRight: topRight,
    bottomLeft: bottomLeft,
    bottomRight: bottomRight,
  }
}

/**
 * 计算两条线段的交点
 * @param p1 线段1的起点
 * @param p2 线段1的终点
 * @param p3 线段2的起点
 * @param p4 线段2的终点
 * @returns 交点
 */
export function calculateIntersection(p1, p2, p3, p4) {
  // 交点公式下部分
  var d1 = (p1[0] - p2[0]) * (p3[1] - p4[1]) // (x1 - x2) * (y3 - y4)
  var d2 = (p1[1] - p2[1]) * (p3[0] - p4[0]) // (y1 - y2) * (x3 - x4)
  var d = d1 - d2

  if (d == 0) {
    throw new Error('Number of intersection points is zero or infinity.')
  }

  // 交点公式上部分
  var u1 = p1[0] * p2[1] - p1[1] * p2[0] // (x1 * y2 - y1 * x2)
  var u4 = p3[0] * p4[1] - p3[1] * p4[0] // (x3 * y4 - y3 * x4)

  var u2x = p3[0] - p4[0] // (x3 - x4)
  var u3x = p1[0] - p2[0] // (x1 - x2)
  var u2y = p3[1] - p4[1] // (y3 - y4)
  var u3y = p1[1] - p2[1] // (y1 - y2)

  // 交点公式
  var px = (u1 * u2x - u3x * u4) / d
  var py = (u1 * u2y - u3y * u4) / d

  var p = { x: round(px, 2), y: round(py, 2) }

  return p
}

/**
 * 获取渐变点的绝对坐标
 * @param topLeftCorner 元素左上角坐标
 * @param pointRelativeCoords 渐变点相对坐标
 * @param shapeCenter 元素中心点坐标
 * @param elemRotate 元素旋转角度
 * @returns 渐变点绝对坐标
 */
export function getGradientPoints(topLeftCorner, pointRelativeCoords, shapeCenter, elemRotate) {
  const pointAbsoluteCoords = rotate(topLeftCorner[0], topLeftCorner[1], topLeftCorner[0] + pointRelativeCoords[0], topLeftCorner[1] + pointRelativeCoords[1], elemRotate)
  return pointAbsoluteCoords
}

const getFillGradientStops = (fill, gradientAngle, gradientHandlePositions, node) => {
  // 计算渐变线段长度
  const lineChangeCoords = [(gradientHandlePositions[1].x - gradientHandlePositions[0].x) * node.width, (1 - gradientHandlePositions[1].y - (1 - gradientHandlePositions[0].y)) * node.height]
  const currentLineSize = Math.sqrt(lineChangeCoords[0] ** 2 + lineChangeCoords[1] ** 2)

  // 计算渐变线段长度
  const desiredLength = ((node.width + node.height) / 2) * 4
  // 计算缩放比例
  const scaleFactor = (desiredLength - currentLineSize) / 2 / currentLineSize
  // 计算渐变线段坐标
  const scaleCoords = [lineChangeCoords[0] * scaleFactor, lineChangeCoords[1] * scaleFactor]

  // 元素旋转角度
  // const elemRotate = node.contentStyle.rotation.angle || 0
  // 实际看设计稿，不需要计算旋转角度
  const elemRotate = 0
  const corners = getCorners(node, elemRotate)

  // 计算元素中心点
  const shapeCenter = calculateIntersection(corners.topLeft, corners.bottomRight, corners.topRight, corners.bottomLeft)

  // 计算渐变线段坐标
  const scaledArbGradientLine = [
    getGradientPoints(
      [corners.topLeft[0], corners.topLeft[1]],
      [gradientHandlePositions[0].x * node.width - scaleCoords[0], gradientHandlePositions[0].y * node.height + scaleCoords[1]],
      [shapeCenter.x, shapeCenter.y],
      elemRotate
    ),
    getGradientPoints(
      [corners.topLeft[0], corners.topLeft[1]],
      [gradientHandlePositions[1].x * node.width + scaleCoords[0], gradientHandlePositions[1].y * node.height - scaleCoords[1]],
      [shapeCenter.x, shapeCenter.y],
      elemRotate
    ),
  ]

  // 获取渐变线段相关角
  const centers = {
    top: (gradientAngle > 90 && gradientAngle <= 180) || (gradientAngle > 270 && gradientAngle <= 360) ? corners.topLeft : corners.topRight,
    bottom: (gradientAngle >= 0 && gradientAngle <= 90) || (gradientAngle > 180 && gradientAngle <= 270) ? corners.bottomLeft : corners.bottomRight,
  }

  // 计算垂直线
  const topLine = [
    rotate(centers.top[0], centers.top[1], centers.top[0] - desiredLength / 2, centers.top[1], elemRotate),
    rotate(centers.top[0], centers.top[1], centers.top[0] + desiredLength / 2, centers.top[1], elemRotate),
  ]
  // 计算旋转后的垂直线
  const rotatedtopLine = [
    rotateElipse(centers.top[0], centers.top[1], centers.top[0] - topLine[0][0], (centers.top[0] - topLine[0][0]) * (node.height / node.width), gradientAngle, elemRotate),
    rotateElipse(centers.top[0], centers.top[1], centers.top[0] - topLine[1][0], (centers.top[0] - topLine[1][0]) * (node.height / node.width), gradientAngle, elemRotate),
  ]
  // 计算垂直线
  const bottomLine = [
    rotate(centers.bottom[0], centers.bottom[1], centers.bottom[0] - desiredLength / 2, centers.bottom[1], elemRotate),
    rotate(centers.bottom[0], centers.bottom[1], centers.bottom[0] + desiredLength / 2, centers.bottom[1], elemRotate),
  ]
  // 计算旋转后的垂直线
  const rotatedbottomLine = [
    rotateElipse(centers.bottom[0], centers.bottom[1], centers.bottom[0] - bottomLine[0][0], (centers.bottom[0] - bottomLine[0][0]) * (node.height / node.width), gradientAngle, elemRotate),
    rotateElipse(centers.bottom[0], centers.bottom[1], centers.bottom[0] - bottomLine[1][0], (centers.bottom[0] - bottomLine[1][0]) * (node.height / node.width), gradientAngle, elemRotate),
  ]
  const perpLines = { top: rotatedtopLine, bottom: rotatedbottomLine }

  // 计算渐变线段相关部分（渐变线段 -> 取垂直线与渐变线段的交点）
  const topLineIntersection = calculateIntersection(perpLines.top[0], perpLines.top[1], scaledArbGradientLine[0], scaledArbGradientLine[1])
  const bottomLineIntersection = calculateIntersection(perpLines.bottom[0], perpLines.bottom[1], scaledArbGradientLine[0], scaledArbGradientLine[1])
  const gradientLine = {
    topCoords: topLineIntersection,
    bottomCoords: bottomLineIntersection,
  }
  // 计算渐变线段距离
  const gradientLineDistance = Math.sqrt((gradientLine.bottomCoords.y - gradientLine.topCoords.y) ** 2 + (gradientLine.bottomCoords.x - gradientLine.topCoords.x) ** 2)
  // 计算渐变句柄百分比
  const rounded = {
    x1: Math.round(gradientHandlePositions[0].x * 100) / 100,
    x2: Math.round(gradientHandlePositions[1].x * 100) / 100,
    y1: Math.round(gradientHandlePositions[0].y * 100) / 100,
    y2: Math.round(gradientHandlePositions[1].y * 100) / 100,
  }
  const fillGradientStops = fill.gradientStops.map((stop) => {
    const color = htmlColor(stop.color, stop.color.a * (fill.opacity || 1))

    let gradientStartPoint = { x: 0, y: 0 }
    if (rounded.y1 < rounded.y2) {
      gradientStartPoint = gradientLine.topCoords.y < gradientLine.bottomCoords.y ? gradientLine.topCoords : gradientLine.bottomCoords
    } else {
      gradientStartPoint = gradientLine.topCoords.y > gradientLine.bottomCoords.y ? gradientLine.topCoords : gradientLine.bottomCoords
    }

    let absoluteStartingPoint = getGradientPoints(
      corners.topLeft,
      [gradientHandlePositions[0].x * node.width, gradientHandlePositions[0].y * node.height],
      [corners.topLeft[0] + node.width / 2, corners.topLeft[1] + node.height / 2],
      elemRotate
    )
    let colorX = stop.position * lineChangeCoords[0] + absoluteStartingPoint[0]
    let colorY = absoluteStartingPoint[1] - stop.position * lineChangeCoords[1]
    // 计算渐变线段距离
    let colorDistance = Math.sqrt((colorY - gradientStartPoint.y) ** 2 + (colorX - gradientStartPoint.x) ** 2)
    // 计算渐变线段百分比
    let actualPercentage = (colorDistance || 1) / (gradientLineDistance || 1)

    return {
      color,
      percentage: actualPercentage,
    }
  })
  return fillGradientStops
}

figma.showUI(__html__)

figma.ui.onmessage = async ({ id, type, payload = {} }) => {
  try {
    const selection = figma.currentPage.selection
    const node = selection[0]
    console.log(node, 'node')
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
      const gradientAngle = unadjustedAngle + 90
      console.log('gradientAngle', gradientAngle)

      const fillGradientStops = getFillGradientStops(fill, gradientAngle, gradientHandlePositions, node)

      const isReverse = fillGradientStops[0].percentage > fillGradientStops[1].percentage

      const mappedFill = fillGradientStops
        .map((stop) => {
          const percentage = isReverse ? 1 - stop.percentage : stop.percentage
          return `${stop.color} ${(percentage * 100).toFixed(2)}%`
        })
        .join(', ')

      console.log(`linear-gradient(${gradientAngle.toFixed(2)}deg, ${mappedFill})`)
    }
  } catch (error) {
    console.log(error)
  }
}
