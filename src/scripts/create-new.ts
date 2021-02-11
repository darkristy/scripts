/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable no-undef */
/* eslint-disable no-shadow */

import * as fs from "fs";
import * as path from "path";
import * as child from "child_process";
import * as util from "util";

import * as inquirer from "inquirer";
import * as chalk from "chalk";

const Listr = require("listr");

const exec = util.promisify(child.exec);

const repos = {
	nextjs: "git@github.com:darkristy/nextjs-template.git",
	nextjsTypescript: "git@github.com:darkristy/nextjs-typescript-starter.git",
	gatsbyTypescript: "git@github.com:darkristy/gatsby-starter-with-typescript.git",
	expressjs: "git@github.com:darkristy/postgres-express-api-starter.git",
};

const helpers = {
	getCurrentDirectory: process.cwd(),
	exists: async (filePath) => !!fs.existsSync(filePath),
	createNewDirectory: async (projectPath) => fs.mkdirSync(projectPath),
	changeToNewDirectory: async (projectPath) => process.chdir(projectPath),
	createNewRepository: async (projectName, status) => {
		await exec(`gh repo create ${projectName} ${status} -y`);
	},
};

const waitASecond = async () => new Promise((resolve) => setTimeout(resolve, 1000));

const { exists, getCurrentDirectory, createNewDirectory, changeToNewDirectory, createNewRepository } = helpers;

const repo = (answers) => {
	const isNextjs = answers.framework === "Next.js" && answers.typescript !== true;
	const isNextjsWithTypeScript = answers.framework === "Next.js" && answers.typescript;
	const isGatsbyWithTypescript = answers.framework === "Gatsby" && answers.typescript === true;
	const isExpress = answers.framework === "Express.js";
	return (
		(isNextjs && repos.nextjs) ||
		(isNextjsWithTypeScript && repos.nextjsTypescript) ||
		(isGatsbyWithTypescript && repos.gatsbyTypescript) ||
		(isExpress && repos.expressjs)
	);
};

const taskList = (answers) => {
	const projectName = answers.projectname;
	const projectPath = path.join(getCurrentDirectory, projectName);

	const repositoryStatus = `--public`;

	const editor = () => exec(`code .`);

	const createLocalProject = [
		{
			title: `Creating project directory for ${projectName}`,
			task: async () => {
				await waitASecond();
				createNewDirectory(projectPath).catch(() => {
					if (exists(projectPath)) {
						console.error(chalk.red(`Folder ${projectPath} exists. Delete or use another name.`));
					}
					process.exit(1);
				});
			},
		},

		{
			title: `Opening up project directory`,
			task: async () => {
				await waitASecond();
				changeToNewDirectory(projectPath).catch((err) => err.message);
			},
		},
		{
			title: `Cloning repo into ${projectName} directory`,
			task: async () => {
				const { stdout } = await exec(`git clone --depth=1 ${repo(answers)} ${projectPath}`);
				stdout;
			},
		},
		{
			title: `Removing .git folder`,
			task: async () => {
				const { stdout } = await exec(`
				rimraf ${projectPath}/.git
				`);
				stdout;
			},
		},
	];

	const createGitRepository = [
		{
			title: `Initializing git repository`,
			task: async () => {
				await waitASecond();
				const { stdout } = await exec("git init");
				stdout;
			},
		},

		{
			title: `Creating remote git repository`,
			task: async () => {
				await waitASecond();
				const repositoryName = `${projectName}`;
				await createNewRepository(repositoryName, repositoryStatus);
			},
		},
	];

	const pushProjectToGitRepository = [
		{
			title: `Pushing local project to remote repository`,
			task: async () => {
				await waitASecond();
				await exec("git add .");
				await exec("git commit -m 'Initial Commit'");
				await exec("git push -u origin master");
			},
		},
	];

	const installLocalDependencies = [
		{
			title: `Installing Dependencies with Yarn`,
			task: async (ctx, task) => {
				await waitASecond();
				await exec("yarn").catch(() => {
					ctx.yarn = false;
					task.skip("Yarn not available, install it via `npm install -g yarn`");
				});
			},
		},
		{
			title: "Install package dependencies with npm",
			enabled: (ctx) => ctx.yarn === false,
			task: async () => {
				await exec("npm install");
			},
		},
		{
			title: `Opening Project`,
			task: async () => {
				await waitASecond();
				await editor();
			},
		},
	];

	return [...createLocalProject, ...createGitRepository, ...pushProjectToGitRepository, ...installLocalDependencies];
};

export const createNew = (): any => {
	inquirer
		.prompt([
			{
				type: "input",
				message: "What is the project name?",
				name: "projectname",
			},
			{
				type: "list",
				message: "What project are you creating?",
				name: "framework",
				choices: ["Next.js", "Gatsby", "Express.js"],
			},
			{
				type: "confirm",
				message: "Do you want to use Typescript?",
				name: "typescript",
			},
		])
		.then((answers) => {
			const tasks = new Listr([...taskList(answers)]);
			tasks.run();
		});
};
