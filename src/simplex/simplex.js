const _ = require('underscore')
// alguns problemas de base generada podem não ser resolvidos
// ainda não resolve problema com bases reais
// ainda não resolve problemas com x negativo
// alguns problemas com variaveis aritificiais podem não ser resolvidos

const selectorVars = document.getElementById('vars')
const selectorRestrictions = document.getElementById('rest')
const modal = document.getElementById('modal-body-result')

function parseResult(result) {
	let xB = result.xB.map((x, i) => `x${result.B[i] + 1} = ${x.toFixed(2)}`);
	let S = result.S;
	if (S % 1 !== 0) {
		S = S.toFixed(2);
	}
	S < 0 ? S = S * -1 : S;
	S = `${S != 0 ? S : null}`;
	const MSG = result.MSG;
	return { xB: xB, S, MSG }
}

function submite() {
	const fn = getFn()
	const restrictions = getRestrictions()
	const mode = getMode()
	let simplex = new Simplex()
	simplex.setFn([...fn])
	simplex.setRestrictions([...restrictions])
	simplex.setMode(mode)
	const simplexSolve = parseResult(simplex.solve())
	modal.innerHTML = ''
	const content = `<b>x*: [${simplexSolve.xB}]</b><br><b>z*[${simplexSolve.S}]</b><br>`
	modal.innerHTML += content
	if (!simplexSolve.MSG.lenght) {
		modal.innerHTML += `<b>msg: [${simplexSolve.MSG}]</b><br>`
	}
}

function getMode() {
	return flexCheckDefault.checked ? 'int' : 'float'
}
function getOp() {
	return document.getElementById('op').value
}

function getFn() {
	let fn = []
	fn.push(getOp())
	for (let i = 0; i < selectorVars.value; i++) {
		if (isNaN(parseFloat(document.getElementById(`x${i + 1}`).value))) {
			fn.push(0)
			continue
		}
		fn.push(parseFloat(document.getElementById(`x${i + 1}`).value))
	}
	return fn
}

function getRestrictions() {
	let restrictions = []
	for (let i = 0; i < selectorRestrictions.value; i++) {
		let restriction = []
		for (let j = 0; j < selectorVars.value; j++) {
			restriction.push(parseFloat(document.getElementById(`x${j + 1}r${i + 1}`).value))
		}

		restriction.push(document.getElementById(`select${i + 1}`).value)
		restriction.push(parseFloat(document.getElementById(`b${i + 1}`).value))
		restrictions.push(restriction)
	}
	return restrictions
}

function insertZ() {
	var funcObj = document.getElementById('funcObj')
	funcObj.innerHTML = ''
	if (isNaN(selectorVars.value) || selectorVars.value < 1) return alert('Número de variáveis inválido')
	var content = '<b>z = </b>'
	for (let i = 0; i < selectorVars.value; i++) {
		content += `<input class="form-control" type="number" id="x${i + 1}" placeholder="x${i + 1}" aria-label="default input example"><b>${i == parseInt(selectorVars.value) - 1 ? ' ' : '+'}`

	}



	funcObj.innerHTML = content
}

function insertRestrictions() {
	var restrictions = document.getElementById('rests')
	restrictions.innerHTML = ''
	if (isNaN(selectorRestrictions.value) || selectorRestrictions.value < 1) return alert('Número de restrições inválido')
	for (let i = 0; i < selectorRestrictions.value; i++) {
		var content = ''
		for (let j = 0; j < selectorVars.value; j++) {
			content += `<input class="form-control" type="number" id="x${j + 1}r${i + 1}" placeholder="x${j + 1}" aria-label="default input example">${j == parseInt(selectorVars.value) - 1 ? ' ' : '+'}`
		}
		content += `
		<select class="form-select same-width w-10 mr-2" aria-label="Default select example" id="select${i + 1}">
			<option value="<=">=<</option>
			<option value=">=">>=</option>
			<option value=">">=</option>
		</select>
		<input class="form-control" type="number" id="b${i + 1}" placeholder="b" aria-label="default input example">`
		restrictions.innerHTML += `<center><div class="row">${content}</div></center>`
	}
}


class Simplex {
	constructor() {
		this.costs = []
		this.restrictions = []
		this.originalVars = []
	}


	fase1() {
		this.mat = createMatrix(this.restrictions)
		this.b = this.restrictions.map(x => x.value)

		const oldRestrictions = this.restrictions.slice()
		const oldMat = this.mat.map(row => row.slice())
		const oldCosts = this.costs.slice()
		const oldFnSize = this.fnSize * 1

		this.addIdentity()
		this.setInitialBandN()

		const j = this.costs.length - this.restrictions.length
		this.artificialCosts = this.costs.map((x, i) => i < j ? 0 : 1)

		const solver = new SimplexSteps(this.mat, this.b, this.artificialCosts, this.B, this.N, this.mode, this.restrictions, this.originalVars)
		const { B, N } = solver.exec()
		this.B = B
		this.N = N.filter(x => x < j)
		this.mat = oldMat
		this.restrictions = oldRestrictions
		this.fnSize = oldFnSize
		this.costs = oldCosts
	}

	fase2() {

		if (!this.mat) {
			this.mat = createMatrix(this.restrictions)
			this.b = this.restrictions.map(x => x.value)
			this.setInitialBandN()
		}

		let solver = new SimplexSteps(this.mat, this.b, this.costs, this.B, this.N, this.mode, this.restrictions, this.originalVars)
		let response = solver.exec()
		return response
	}

	solve() {
		this.toStandardFn()

		if (this.needFase1) {
			this.fase1()
		}

		return this.fase2()
	}

	setFn(fn) {
		this.fnType = fn.splice(0, 1)[0]
		fn.forEach(x => this.costs.push(x) && this.originalVars.push(x))
		this.fnSize = this.costs.length
	}

	setMode(mode) {
		this.mode = mode
	}


	addRestriction(fn) {
		// X é igual a b, portanto b não pode ser negativo.
		// Quando b for negativo, inverte função.
		if (fn.value < 0) {
			fn.value = fn.value * -1
			fn.vars = fn.vars.map(c => c * -1)

			switch (fn.type) {
				case '>=': fn.type = '<='; break
				case '<=': fn.type = '>='; break
				case '>': fn.type = '<'; break
				case '<': fn.type = '>'; break
				default: fn.type = '='
			}
		}

		this.restrictions.push(fn)
	}

	setRestrictions(fns) {
		fns.forEach(fn => this.addRestriction(Restriction(fn)))
	}

	toStandardFn() {
		this.originalType = this.fnType
		if (this.fnType === 'max') {
			this.type = 'min'
			this.costs = this.costs.map(x => x * (-1))
		}

		this.costs = [...this.costs, ...Array(this.restrictions.length).fill(0)]


		let pos = 0
		this.restrictions = this.restrictions.map(res => {
			const newVars = Array(this.restrictions.length).fill(0)

			switch (res.type) {
				case '>=': newVars[pos++] = -1; break
				case '<=': newVars[pos++] = 1; break
				case '>': newVars[pos++] = -1; break
				case '<': newVars[pos++] = 1; break
				default: newVars[pos++] = 0
			}

			res.vars = [...res.vars, ...newVars]
			return res
		})

	}

	addIdentity() {
		this.mat.forEach((x, i) => {
			x.push(...this.restrictions.map((r, j) => i === j ? 1 : 0))
			this.costs.push(0)
		})

		this.fnSize += this.restrictions.length
	}

	setInitialBandN() {
		let bSize = this.restrictions.length
		let nSize = this.fnSize

		this.N = Array(nSize).fill(0).map((x, i) => i)
		this.B = Array(bSize).fill(0).map((x, i) => this.fnSize + i)
	}


	get needFase1() {
		// Adicionar variáveis artificiais.
		let need = false
		this.restrictions.map(r => {
			if (r.type !== '<=') { need = true }
		})

		return need
	}
}

class SimplexSteps {
	constructor(mat, b, costs, B, N, mode, restrictions, originalVars) {
		this.b = b
		this.mat = mat
		this.costs = costs
		this.B = B
		this.N = N
		this.S = 0
		this.MSG = []
		this.ERRORS = []
		this.mode = mode
		this.isOptimal = false
		this.restrictions = restrictions
		this.originalVars = originalVars
	}

	exec() {
		try {
			for (let it = 1; true; it++) {
				this.calcBasicSolution()
				this.calcVector()
				this.calcRelativeCosts()
				this.whoEntersInB()
				if (this.isGreatSolution()) {
					if (this.mode === 'float') {
						this.isOptimal = true
						break
					}
					this.addGomoryCut()
					if (this.isOptimal) {
						break
					}
				}
				this.calcSimplexDir()
				if (this.whoLeft()) {
					break
				}
				this.refreshB()
			}

			return {
				xB: this.xB,
				N: this.N,
				B: this.B,
				S: this.S,
				MSG: this.MSG,
				isOptimal: this.isOptimal
			}
		} catch (error) {
			this.ERRORS.push(error.message)
			this.MSG.push(`Problema sem solução! Revise seu modelo.`)
			console.log(this.ERRORS)
			return {
				xB: [],
				N: [],
				B: [],
				S: this.S.toFixed(2),
				MSG: this.MSG,
				ERRORS: this.ERRORS
			}
		}
	}


	addGomoryCut() {
		// todo: obter os valores da linha da matriz correspondente ao xB nao inteiro.
		// todo: separar as partes inteiras das fracionarias.
		// todo: descartar os inteiros e construir nova restrição >=
		// todo: adicionar nova restrição ao modelo.
		// todo: executar novamente o simplex.

		let newValues = []
		this.restrictions.forEach((restriction, index) => {
			let value = this.xB[index]
			if (!this.isInteger(value)) {
				newValues.push({
					vars: restriction.vars,
					value: value
				})
			}
		})
		if (newValues.length > 0) {
			this.xB.forEach((value, index) => {
				let fraction = value - Math.floor(value);
				let roundedValue = fraction <= 0.5 ? Math.floor(value) : Math.ceil(value);
				if (roundedValue !== value) {
					let restrictionIndex = newValues.findIndex(restriction => restriction.value === value)
					if (restrictionIndex !== -1) {
						newValues.splice(restrictionIndex, 1)
					}
					this.xB[index] = roundedValue;
				}
			})
			this.S = 0
			this.B.forEach((b, i) => {
				if (this.originalVars[b] !== undefined) {
					console.log(this.originalVars[b])
					console.log(this.xB[i])
					this.S += this.originalVars[b] * this.xB[i];
				}
			});
			this.S % 1 === 0 ? this.S = this.S : this.S = this.S.toFixed(2)
			// if (this.S !== undefined) {
			//     let fraction = this.S - Math.floor(this.S);
			//     let roundedS = fraction < 0.5 ? Math.floor(this.S) : Math.ceil(this.S);
			//     this.S = roundedS;
			// }
		}
		this.isOptimal = true
	}
	isInteger(number) {
		return (number ^ 0) === number
	}
	separateIntegerFraction(num) {
		var intPart = Math.ceil(num);
		var fracPart = intPart - num;
		if (fracPart === 1) {
			intPart--;
			fracPart = 0;
		}
		return [intPart, fracPart];
	}

	// Passo 1
	calcBasicSolution() {
		this.xB = gauss(this.matrixB, this.b)

		let xChapeu = Array(this.costs.length).fill(0)
		this.B.forEach((x, i) => xChapeu[x] = this.xB[i])
		this.S = 0
		this.costs.forEach((c, i) => {
			this.S += c * xChapeu[i]
		})
	}

	// Passo 2.1
	calcVector() {
		const Cb = this.B.map(i => this.costs[i])
		this.lambda = gauss(this.matrixBt, Cb)
	}

	// Passo 2.2
	calcRelativeCosts() {
		this.CN = this.N.map(n => {
			let r = this.getCN(n) - mulMatrix(this.lambda, this.column(n))
			return r
		})

	}

	// Passo 2.3
	whoEntersInB() {
		this.Cnk = Infinity
		this.CN.forEach((x, i) => {
			if (x < this.Cnk) {
				this.k = i
				this.Cnk = x
			}
		})
	}

	// Passo 3
	isGreatSolution() {
		if (this.Cnk >= 0) {
			return true
		}

		return false
	}

	// Passo 4
	calcSimplexDir() {
		this.y = gauss(this.matrixB, this.column(this.N[this.k]))
	}

	// Passo 5
	whoLeft() {
		let yNeg = this.y.filter(x => x <= 0)
		if (yNeg.length === this.y.length) {
			const ilimitedSolution = ` Todo y <= 0, portanto o problema não tem solução otima finita.`
			this.MSG.push(ilimitedSolution)
			return true
		}


		this.epsilonValue = Infinity
		this.epsilon = 0
		this.y.forEach((y, i) => {
			if (y > 0) {
				let e = this.xB[i] / this.y[i]
				if (this.epsilonValue > e) {
					this.epsilonValue = e
					this.epsilon = i
				}
			}
		})


		return false
	}

	// Passo 6
	refreshB() {
		let temp = this.B[this.epsilon]
		this.B[this.epsilon] = this.N[this.k]
		this.N[this.k] = temp
	}

	get matrixB() {
		let mt = _.zip(...this.mat)
		let bt = this.B.map(i => mt[i])
		return _.zip(...bt)
	}

	get matrixBt() {
		let mt = _.zip(...this.mat)
		return this.B.map(i => mt[i])
	}

	column(x) {
		let mt = _.zip(...this.mat)
		return mt[x]
	}

	getCN(n) {
		return this.costs[n]
	}
}

const Restriction = (fn) => ({
	type: fn.splice(-2, 1)[0],
	value: fn.splice(-1, 1)[0],
	vars: fn
})

function createMatrix(restrictions) {
	return [...restrictions.map(x => x.vars)]
}

function mulMatrix(a, b) {
	let result = 0
	a.forEach((x1, i) => {
		result += x1 * b[i]
	})
	return result
}

// implementação método de gauss
var abs = Math.abs;

function array_fill(i, n, v) {
	var a = [];
	for (; i < n; i++) {
		a.push(v);
	}
	return a;
}

const gauss = (A, x = []) => {
	var i, k, j;

	for (i = 0; i < A.length; i++) {
		A[i].push(x[i]);
	}
	var n = A.length;

	for (i = 0; i < n; i++) {
		var maxEl = abs(A[i][i]),
			maxRow = i;
		for (k = i + 1; k < n; k++) {
			if (abs(A[k][i]) > maxEl) {
				maxEl = abs(A[k][i]);
				maxRow = k;
			}
		}


		for (k = i; k < n + 1; k++) {
			var tmp = A[maxRow][k];
			A[maxRow][k] = A[i][k];
			A[i][k] = tmp;
		}

		for (k = i + 1; k < n; k++) {
			var c = -A[k][i] / A[i][i];
			for (j = i; j < n + 1; j++) {
				if (i === j) {
					A[k][j] = 0;
				} else {
					A[k][j] += c * A[i][j];
				}
			}
		}
	}

	x = array_fill(0, n, 0);
	for (i = n - 1; i > -1; i--) {
		x[i] = A[i][n] / A[i][i];
		for (k = i - 1; k > -1; k--) {
			A[k][n] -= A[k][i] * x[i];
		}
	}

	return x;
}
module.exports = Simplex
