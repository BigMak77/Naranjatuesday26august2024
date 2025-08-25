export default function transformer(file, api) {
  const j = api.jscodeshift
  const root = j(file.source)

  function wrapAsyncArrow(arrow) {
    if (!arrow || arrow.type !== 'ArrowFunctionExpression' || !arrow.async) return null
    const asyncIife = j.callExpression(
      j.arrowFunctionExpression(arrow.params, arrow.body, true),
      []
    )
    asyncIife.callee.async = true
    const voidStmt = j.expressionStatement(j.unaryExpression('void', asyncIife))
    return j.arrowFunctionExpression(arrow.params, j.blockStatement([voidStmt]), false)
  }

  // setTimeout / setInterval
  root.find(j.CallExpression, {
    callee: { type: 'Identifier', name: (n) => n === 'setTimeout' || n === 'setInterval' }
  }).forEach(p => {
    const args = p.node.arguments
    const wrapped = wrapAsyncArrow(args[0])
    if (wrapped) args[0] = wrapped
  })

  // ...addEventListener(...)
  root.find(j.CallExpression, {
    callee: { type: 'MemberExpression', property: { type: 'Identifier', name: 'addEventListener' } }
  }).forEach(p => {
    const args = p.node.arguments
    if (args.length < 2) return
    const wrapped = wrapAsyncArrow(args[1])
    if (wrapped) args[1] = wrapped
  })

  return root.toSource({ quote: 'single' })
}