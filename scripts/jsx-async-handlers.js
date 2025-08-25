export default function transformer(file, api) {
  const j = api.jscodeshift
  const root = j(file.source)

  root.find(j.JSXAttribute).forEach(p => {
    const attr = p.node
    if (!attr.value || attr.value.type !== 'JSXExpressionContainer') return
    const exp = attr.value.expression
    if (!exp || exp.type !== 'ArrowFunctionExpression' || !exp.async) return

    // Build: () => { void (async () => { /* original body */ })() }
    const asyncIife = j.callExpression(
      j.arrowFunctionExpression(exp.params, exp.body, true),
      []
    )
    asyncIife.callee.async = true
    const voidStmt = j.expressionStatement(j.unaryExpression('void', asyncIife))
    const wrapped = j.arrowFunctionExpression(exp.params, j.blockStatement([voidStmt]), false)

    attr.value = j.jsxExpressionContainer(wrapped)
  })

  return root.toSource({ quote: 'single' })
}