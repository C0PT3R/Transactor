import BudgetSimulator from './BudgetSimulator/BudgetSimulator.js'

let useConfig = "config"
let paramString = location.href.split('?')[1];
let queryString = new URLSearchParams(paramString);
for (let kv of queryString.entries()) {
	if (kv[0] == "config") useConfig = kv[1]
}

function appendToBody(content: string) {
	document.body.innerHTML += content
}

BudgetSimulator.fromFile('./' + useConfig + '.json').then(sim => {
	//@ts-ignore
	window.sim = sim
	sim.simulate(appendToBody)
})