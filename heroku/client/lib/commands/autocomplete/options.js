"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@heroku-cli/command");
const core_1 = require("@oclif/core");
const path = require("path");
const base_1 = require("../../lib/autocomplete/base");
const cache_1 = require("../../lib/autocomplete/cache");
class Options extends base_1.AutocompleteBase {
    constructor() {
        super(...arguments);
        this.parsedArgs = {};
        this.parsedFlags = {};
    }
    // helpful dictionary
    //
    // *args: refers to a Command's static args
    // *argv: refers to the current execution's command line positional input
    // Klass: (class) Command class
    // completion: (object) object with data/methods to build/retrieve options from cache
    // curPosition*: the current argv position the shell is trying to complete
    // options: (string) white-space separated list of values for the shell to use for completion
    async run() {
        this.errorIfWindows();
        // ex: heroku autocomplete:options 'heroku addons:destroy -a myapp myaddon'
        try {
            const commandStateVars = await this.processCommandLine();
            const completion = this.determineCompletion(commandStateVars);
            const options = await this.fetchOptions(completion);
            if (options)
                this.log(options);
        }
        catch (error) {
            // write to ac log
            this.writeLogFile(error.message);
        }
    }
    async processCommandLine() {
        // find command id
        const commandLineToComplete = this.argv[0].split(' ');
        const id = commandLineToComplete[1];
        // find Command
        const C = this.config.findCommand(id);
        let Klass;
        if (C) {
            Klass = await C.load();
            // process Command state from command line data
            const slicedArgv = commandLineToComplete.slice(2);
            const [argsIndex, curPositionIsFlag, curPositionIsFlagValue] = this.determineCmdState(slicedArgv, Klass);
            return { id, Klass, argsIndex, curPositionIsFlag, curPositionIsFlagValue, slicedArgv };
        }
        this.throwError(`Command ${id} not found`);
    }
    determineCompletion(commandStateVars) {
        const { id, Klass, argsIndex, curPositionIsFlag, curPositionIsFlagValue, slicedArgv } = commandStateVars;
        // setup empty cache completion vars to assign
        let cacheKey;
        let cacheCompletion;
        // completing a flag/value? else completing an arg
        if (curPositionIsFlag || curPositionIsFlagValue) {
            const slicedArgvCount = slicedArgv.length;
            const lastArgvArg = slicedArgv[slicedArgvCount - 1];
            const previousArgvArg = slicedArgv[slicedArgvCount - 2];
            const argvFlag = curPositionIsFlagValue ? previousArgvArg : lastArgvArg;
            const { name, flag } = this.findFlagFromWildArg(argvFlag, Klass);
            if (!flag)
                this.throwError(`${argvFlag} is not a valid flag for ${id}`);
            cacheKey = name || flag.name;
            cacheCompletion = flag.completion;
        }
        else {
            const cmdArgs = Klass.args || [];
            // variable arg (strict: false)
            if (!Klass.strict) {
                cacheKey = cmdArgs[0] && cmdArgs[0].name.toLowerCase();
                cacheCompletion = this.findCompletion(cacheKey, id);
                if (!cacheCompletion)
                    this.throwError(`Cannot complete variable arg position for ${id}`);
            }
            else if (argsIndex > cmdArgs.length - 1) {
                this.throwError(`Cannot complete arg position ${argsIndex} for ${id}`);
            }
            else {
                const arg = cmdArgs[argsIndex];
                cacheKey = arg.name.toLowerCase();
            }
        }
        // try to auto-populate the completion object
        if (!cacheCompletion) {
            cacheCompletion = this.findCompletion(cacheKey, id);
        }
        return { cacheKey, cacheCompletion };
    }
    async fetchOptions(cache) {
        const { cacheCompletion, cacheKey } = cache;
        const flags = await this.parsedFlagsWithEnvVars();
        // build/retrieve & return options cache
        if (cacheCompletion && cacheCompletion.options) {
            const ctx = {
                args: this.parsedArgs,
                // special case for app & team env vars
                flags,
                argv: this.argv,
                config: this.config,
            };
            // use cacheKey function or fallback to arg/flag name
            const ckey = cacheCompletion.cacheKey ? await cacheCompletion.cacheKey(ctx) : null;
            const key = ckey || cacheKey || 'unknown_key_error';
            const flagCachePath = path.join(this.completionsCacheDir, key);
            // build/retrieve cache
            const duration = cacheCompletion.cacheDuration || 60 * 60 * 24; // 1 day
            const opts = { cacheFn: () => cacheCompletion.options(ctx) };
            const options = await (0, cache_1.fetchCache)(flagCachePath, duration, opts);
            // return options cache
            return (options || []).join('\n');
        }
    }
    async parsedFlagsWithEnvVars() {
        const { flags } = await this.parse(Options);
        return Object.assign({ app: process.env.HEROKU_APP || flags.app, team: process.env.HEROKU_TEAM || process.env.HEROKU_ORG }, this.parsedFlags);
    }
    throwError(msg) {
        throw new Error(msg);
    }
    findFlagFromWildArg(wild, Klass) {
        let name = wild.replace(/^-+/, '');
        name = name.replace(/[=](.+)?$/, '');
        const unknown = { flag: undefined, name: undefined };
        if (!Klass.flags)
            return unknown;
        const CFlags = Klass.flags;
        let flag = CFlags[name];
        if (flag)
            return { name, flag };
        name = Object.keys(CFlags).find((k) => CFlags[k].char === name) || 'undefinedcommand';
        flag = CFlags && CFlags[name];
        if (flag)
            return { name, flag };
        return unknown;
    }
    determineCmdState(argv, Klass) {
        const argNames = Object.keys(Klass.args || {});
        let needFlagValueSatisfied = false;
        let argIsFlag = false;
        let argIsFlagValue = false;
        let argsIndex = -1;
        let flagName;
        argv.filter(wild => {
            if (wild.match(/^-(-)?/)) {
                // we're a flag
                argIsFlag = true;
                // ignore me
                const wildSplit = wild.split('=');
                const key = wildSplit.length === 1 ? wild : wildSplit[0];
                const { name, flag } = this.findFlagFromWildArg(key, Klass);
                flagName = name;
                // end ignore me
                if (wildSplit.length === 1) {
                    // we're a flag w/o a '=value'
                    // (find flag & see if flag needs a value)
                    if (flag && flag.type !== 'boolean') {
                        // we're a flag who needs our value to be next
                        argIsFlagValue = false;
                        needFlagValueSatisfied = true;
                        return false;
                    }
                }
                // --app=my-app is considered a flag & not a flag value
                // the shell's autocomplete handles partial value matching
                // add parsedFlag
                if (wildSplit.length === 2 && name)
                    this.parsedFlags[name] = wildSplit[1];
                // we're a flag who is satisfied
                argIsFlagValue = false;
                needFlagValueSatisfied = false;
                return false;
            }
            // we're not a flag
            argIsFlag = false;
            if (needFlagValueSatisfied) {
                // we're a flag value
                // add parsedFlag
                if (flagName)
                    this.parsedFlags[flagName] = wild;
                argIsFlagValue = true;
                needFlagValueSatisfied = false;
                return false;
            }
            // we're an arg!
            // add parsedArgs
            // TO-DO: how to handle variableArgs?
            argsIndex += 1;
            if (argsIndex < argNames.length) {
                this.parsedArgs[argNames[argsIndex]] = wild;
            }
            argIsFlagValue = false;
            needFlagValueSatisfied = false;
            return true;
        });
        return [argsIndex, argIsFlag, argIsFlagValue];
    }
}
exports.default = Options;
Options.hidden = true;
Options.description = 'display arg or flag completion options (used internally by completion functions)';
Options.flags = {
    app: command_1.flags.app({ required: false, hidden: true }),
};
Options.args = {
    completion: core_1.Args.string({ strict: false }),
};
