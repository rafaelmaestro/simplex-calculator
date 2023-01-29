const Simplex = require('../test/utils.js')


const main = () => {
	testInteira1()
	testZéMariaAparecida()
	// testDegenerada()
	// testSolucaoNegativa()
	// testSolucaoIlimitada()
	// testSolucaoInexistente()
	// testVariavelArtificial1()
	// testVariavelArtificial2()
	// testVariavelArtificial3()
}

function parseTestResult(result) {
	let xB = result.xB.map((x, i) => `x${result.B[i] + 1} = ${x.toFixed(2)}`);
	const S = `Z*: ${result.S != 0 ? result.S.toFixed(2) : null}`;
	const MSG = result.MSG;
	return { xB: xB, S, MSG }
}

function testInteira1() {
	console.log(`process -> ${testInteira1.name}`)
	let simplex = new Simplex()
	simplex.setFn(['max', 2, 1])
	simplex.setRestrictions([
		[2, 5, '<=', 17],
		[3, 2, '<=', 10],
	])
	simplex.setMode('int')
	console.log(parseTestResult(simplex.solve()))
	console.log('\n\n')
}

function testZéMariaAparecida() { // OK 
	console.log(`process -> ${testZéMariaAparecida.name}`)
	let simplex = new Simplex()
	simplex.setFn(['max', 1, 1])
	simplex.setRestrictions([
		[24, 16, '<=', 96],
		[5, 10, '<=', 45]
	])
	simplex.setMode('int')
	console.log(parseTestResult(simplex.solve()))
	// console.log(simplex.solve())
	console.log('\n\n')
}

function testDegenerada() { // OK
	console.log(`process -> ${testDegenerada.name}`)
	let simplex = new Simplex()
	simplex.setFn(['max', 4, 6])
	simplex.setRestrictions([
		[1.5, 4, '<=', 24],
		[1, 3, '<=', 18],
		[1, 1, '<=', 8],
	])
	simplex.setMode('int')
	console.log(parseTestResult(simplex.solve()))
	console.log('\n\n')
}

function testSolucaoNegativa() { //NOK
	console.log(`process -> ${testSolucaoNegativa.name}`)
	let simplex = new Simplex()
	simplex.setFn(['max', -1, 1])
	simplex.setRestrictions([
		[1, 1, '<=', 1],
		[-1, 3, '<=', 2],
		[0, 1, '>=', 0],
	])
	simplex.setMode('int')
	console.log(parseTestResult(simplex.solve()))
	console.log('\n\n')
}

function testSolucaoIlimitada() { // OK 
	console.log(`process -> ${testSolucaoIlimitada.name}`)
	let simplex = new Simplex()
	simplex.setFn(['max', 1, 1])
	simplex.setRestrictions([
		[1, -2, '<=', 2],
		[-2, 1, '<=', 2],
	])
	simplex.setMode('int')
	console.log(parseTestResult(simplex.solve()))
	console.log('\n\n')
}

function testSolucaoInexistente() { // NOK
	console.log(`process -> ${testSolucaoInexistente.name}`)
	let simplex = new Simplex()
	simplex.setFn(['max', 1, 1])
	simplex.setRestrictions([
		[2, -2, '>=', 4],
		[-2, 2, '>=', 4],
	])
	simplex.setMode('int')
	console.log(parseTestResult(simplex.solve()))
	console.log('\n\n')
}

function testVariavelArtificial1() {
	console.log(`process -> ${testVariavelArtificial1.name}`)
	let simplex = new Simplex()
	simplex.setFn(['max', 1, 1])
	simplex.setRestrictions([
		[1, 0, '>=', 1],
		[1, 0, '<=', 2],
		[0, 1, '>=', 1],
		[0, 1, '<=', 2]
	])
	simplex.setMode('int')
	console.log(parseTestResult(simplex.solve()))
	console.log('\n\n')
}


function testVariavelArtificial2() {
	console.log(`process -> ${testVariavelArtificial2.name}`)
	let simplex = new Simplex()
	simplex.setFn(['min', 1, 1])
	simplex.setRestrictions([
		[1, 0, '>=', 1],
		[1, 0, '<=', 2],
		[0, 1, '>=', 1],
		[0, 1, '<=', 2]
	])
	simplex.setMode('int')
	console.log(parseTestResult(simplex.solve()))
	console.log('\n\n')
}

function testVariavelArtificial3() {
	console.log(`process -> ${testVariavelArtificial3.name}`)

	let simplex = new Simplex()
	simplex.setFn(['max', 1, 1])
	simplex.setRestrictions([
		[1, 2, '>=', 1],
		[1, 1, '<=', 5],
	])
	simplex.setMode('int')
	console.log(parseTestResult(simplex.solve()))
	console.log('\n\n')
}


main()
