#!/usr/bin/env js

import * as chalk from "chalk";
import cliSelect from "cli-select";

import createNew from "./scripts/create-new";

const executeScript = (scriptName: string): any => {
	const isCreateNew = scriptName === "create-new";
	return (isCreateNew && createNew()) || new Error();
};

const run = async (): Promise<void> => {
	console.log(chalk.cyanBright(`❯ Choose a script to run.`));
	const script = await cliSelect({
		values: ["create-new", "Minor", "Patch"],
		unselected: "◯",
		selected: chalk.redBright("◉"),
		indentation: 2,
		valueRenderer: (value, selected) => (selected ? chalk.redBright(value) : value),
	});

	executeScript(script.value);
};

run().catch((err) => new Error(err));
