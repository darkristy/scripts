#!/usr/bin/env ts-node

import * as chalk from "chalk";
import * as ora from "ora";
import cliSelect from "cli-select";

import { createNew } from "./scripts/create-new";

const executeScript = (scriptName: string): any => {
	const isCreateNew = scriptName === "create-new";
	return (isCreateNew && createNew()) || new Error();
};

(async (): Promise<void> => {
	console.log(chalk.cyanBright(`❯ Choose a script to run.`));

	const script = await cliSelect({
		values: ["create-new"],
		unselected: "◯",
		cleanup: true,
		selected: chalk.redBright("◉"),
		indentation: 2,
		valueRenderer: (value, selected) => (selected ? chalk.redBright(value) : value),
	});

	const spinner = ora(`Running script ${chalk.yellowBright(script.value)}`).start();
	spinner.color = "yellow";

	setTimeout(() => {
		spinner.stop();
		console.clear();
		executeScript(script.value);
	}, 200);
})().catch((err) => new Error(err));
