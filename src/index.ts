/**
 * @description DO NOT ALLOW USER INPUT ON ANY OF THESE FUNCTIONS. THEY ARE CLI BASED SO ITS UNSAFE.
 * @todo COMPARE, EXPORT, IMPORT, FLAGS need to be implemented still
 */

async function checkPermissions(): Promise<void> {
    if(Deno.build.os !== 'windows') throw new Error(`${Deno.build.os} is not supported`);
    if((await Deno.permissions.query({ name: 'run' })).state === 'prompt') Deno.permissions.request({ name: 'run' });
    if((await Deno.permissions.query({ name: 'run' })).state === 'denied') throw new Error('winreg requires run permission to function');
}

await checkPermissions();
const KeyNameRegex = /\w+(?:\\\w+)+$/;
type RegType = 'REG_SZ' | 'REG_MULTI_SZ' | 'REG_EXPAND_SZ' | 'REG_DWORD' | 'REG_QWORD' | 'REG_BINARY' | 'REG_NONE';
interface queryOptions {
    /** 
     * @description Queries for a specific registry key values. If omitted, all values for the key are queried.
     * Argument to this switch can be optional only when specified along with /f switch. This specifies to search in valuenames only.
     */
    valueName?: string,
    /** @description Queries for the default value or empty value name (Default). */
    defaultValue?: boolean,
    /** @description Queries all subkeys and values recursively (like dir /s). */
    recursive?: boolean,
    /** @description Specifies the separator (length of 1 character only) in data string for REG_MULTI_SZ. Defaults to "\0" as the separator. */
    seperator?: string,
    /** @description Specifies the data or pattern to search for. Default is "*". */
    searchPattern?: string,
    /** @description Specifies to search in key names only. */
    searchKeynamesOnly?: boolean,
    /** @description Specifies the search in data only. */
    searchDataOnly?: boolean,
    /** @description Specifies that the search is case sensitive. The default search is case insensitive. */
    searchCaseSensitive?: boolean,
    /** @description Specifies to return only exact matches. By default all the matches are returned. */
    exactMatches?: boolean,
    /** @description Specifies registry value data type. Valid types are: REG_SZ, REG_MULTI_SZ, REG_EXPAND_SZ, REG_DWORD, REG_QWORD, REG_BINARY, REG_NONE Defaults to all types. */
    dataType?: RegType,
    /** @description Verbose: Shows the numeric equivalent for the type of the valuename. */
    numericValues?: boolean,
    /** @description Specifies the key should be accessed using the 32-bit registry view. */
    viewReg32Bit?: boolean,
    /** @description Specifies the key should be accessed using the 64-bit registry view. */
    viewReg64Bit?: boolean
}
interface queryResponse {
    type: RegType,
    value: string
}

/**
 * @description Queries for registry keys in the KeyName path, returns a Record of key value pair results. DO NOT ALLOW USER INPUT.
 */
export async function query(KeyName: string, _options: queryOptions = new Object): Promise<Record<string, queryResponse>> {
    if(!KeyNameRegex.test(KeyName)) throw new Error(`${KeyName} not of WIN_REG_KEYNAME`);
    let command = `REG QUERY ${KeyName}`;
    if(_options.valueName) command += ` /v ${_options.valueName}`;
    if(_options.defaultValue) command += ' /ve';
    if(_options.recursive) command += ' /s';
    if(_options.seperator) command += ` /se ${_options.seperator.slice(0,1)}`;
    if(_options.searchPattern) {
        command += ` /f "${_options.searchPattern}"`;
        if(_options.searchKeynamesOnly) command += ' /k';
        if(_options.searchDataOnly) command += ' /d';
        if(_options.searchCaseSensitive) command += ' /c';
        if(_options.exactMatches) command += ' /e';
    }
    if(_options.dataType) command += ` /t ${_options.dataType}`;
    if(_options.numericValues) command += ' /z';
    if(_options.viewReg32Bit) command += ' /reg:32';
    if(_options.viewReg64Bit) command += ' /reg:64';
    const blob = new TextDecoder().decode(await Deno.run({
        cmd: ['cmd','/c',...command.split(' ')],
        stdout: 'piped',
        stderr: 'piped'
    }).output());
    const lines = blob.toString().split('\r\n').filter((v: string) => v.length !== 0 && !v.includes(KeyName) && !v.includes('End of search:')).map((v: string) => {
        const arr = v.replace(/\s\s+/g,' ').trim().split(' ');
        return [arr[0],{
            type: arr[1],
            value: arr.slice(2).join(' ') || null
        }];
    });
    return Object.fromEntries(lines);
}

interface addOptions {
    /** @description The value name, under the selected Key, to add. */
    valueName?: string,
    /** @description adds an empty value name (Default) for the key. */
    emptyValueName?: boolean,
    /** @description RegKey data types. If omitted, REG_SZ is assumed. */
    dataType?: RegType,
    /** @description Specify one character that you use as the separator in your data string for REG_MULTI_SZ. If omitted, use "\0" as the separator. */
    seperator?: string,
    /** @description The data to assign to the registry ValueName being added. */
    data?: string,
    /** @description Force overwriting the existing registry entry without prompt. */
    force?: boolean,
    /** @description Specifies the key should be accessed using the 32-bit registry view. */
    viewReg32Bit?: boolean,
    /** @description Specifies the key should be accessed using the 64-bit registry view. */
    viewReg64Bit?: boolean
}
/** 
 * @description Adds a new registry entry at the KeyName location. Forces writing over the KeyName, so be careful. DO NOT ALLOW USER INPUT.
 */
export async function add(KeyName: string, _options: addOptions = new Object): Promise<string> {
    if(!KeyNameRegex.test(KeyName)) throw new Error(`${KeyName} not of WIN_REG_KEYNAME`);
    let command = `REG ADD ${KeyName} /f`;
    if(_options.valueName) command += ` /v ${_options.valueName}`;
    if(_options.emptyValueName) command += ' /ve';
    if(_options.dataType) command += ' /t';
    if(_options.seperator) command += ` /s ${_options.seperator.slice(0,1)}`;
    if(_options.data) command += ` /d ${_options.data.replaceAll(' ','')}`
    if(_options.viewReg32Bit) command += ' /reg:32';
    if(_options.viewReg64Bit) command += ' /reg:64';
    const blob = new TextDecoder().decode(await Deno.run({
        cmd: ['cmd','/c',...command.split(' ')],
        stdout: 'piped',
        stderr: 'piped'
    }).output());
    return blob.toString();
}

interface deleteOptions {
    /** @description The value name, under the selected Key, to delete. When omitted, all subkeys and values under the Key are deleted. */
    valueName?: string,
    /** @description delete the value of empty value name (Default). */
    deleteDefault?: boolean,
    /** @description delete all values under this key. */
    deleteAll?: boolean,
    /** @description Specifies the key should be accessed using the 32-bit registry view. */
    viewReg32Bit?: boolean,
    /** @description Specifies the key should be accessed using the 64-bit registry view. */
    viewReg64Bit?: boolean
}
/**
 * @description Removes a registry entry at the KeyName location. Forces deletion, so be careful. DO NOT ALLOW USER INPUT.
 */
export async function remove(KeyName: string, _options: deleteOptions = new Object): Promise<string> {
    await checkPermissions();
    if(!KeyNameRegex.test(KeyName)) throw new Error(`${KeyName} not of WIN_REG_KEYNAME`);
    let command = `REG DELETE ${KeyName} /f`;
    if(_options.valueName) command += ` /v ${_options.valueName}`;
    if(_options.viewReg32Bit) command += ' /reg:32';
    if(_options.viewReg64Bit) command += ' /reg:64';
    const blob = new TextDecoder().decode(await Deno.run({
        cmd: ['cmd','/c',...command.split(' ')],
        stdout: 'piped',
        stderr: 'piped'
    }).output());
    return blob.toString();
}

interface copyOptions {
    /** @description Copies all subkeys and values. */
    subKeys?: boolean,
    /** @description Specifies the key should be accessed using the 32-bit registry view. */
    viewReg32Bit?: boolean,
    /** @description Specifies the key should be accessed using the 64-bit registry view. */
    viewReg64Bit?: boolean
}
/**
 * @description Copies a registry entry at the KeyName location to the second KeyName location. Forces copy, so be careful. DO NOT ALLOW USER INPUT.
 */
export async function copy(KeyName1: string, KeyName2: string, _options: copyOptions = new Object): Promise<string> {
    if(!KeyNameRegex.test(KeyName1)) throw new Error(`${KeyName1} not of WIN_REG_KEYNAME`);
    if(!KeyNameRegex.test(KeyName2)) throw new Error(`${KeyName2} not of WIN_REG_KEYNAME`);
    let command = `REG COPY ${KeyName1} ${KeyName2} /f`;
    if(_options.subKeys) command += ' /s';
    if(_options.viewReg32Bit) command += ' /reg:32';
    if(_options.viewReg64Bit) command += ' /reg:64';
    const blob = new TextDecoder().decode(await Deno.run({
        cmd: ['cmd','/c',...command.split(' ')],
        stdout: 'piped',
        stderr: 'piped'
    }).output());
    return blob.toString();
}

interface saveOptions {
    /** @description Copies all subkeys and values. */
    subKeys?: boolean,
    /** @description Specifies the key should be accessed using the 32-bit registry view. */
    viewReg32Bit?: boolean,
    /** @description Specifies the key should be accessed using the 64-bit registry view. */
    viewReg64Bit?: boolean
}
/**
 * @description Saves a registry entry at the KeyName location to the provided FileName. Forces overwriting file, so be careful. DO NOT ALLOW USER INPUT.
 */
export async function save(KeyName: string, FileName: string, _options: saveOptions = new Object): Promise<string> {
    if(!KeyNameRegex.test(KeyName)) throw new Error(`${KeyName} not of WIN_REG_KEYNAME`);
    let command = `REG SAVE ${KeyName} ${FileName} /y`;
    if(_options.subKeys) command += ' /s';
    if(_options.viewReg32Bit) command += ' /reg:32';
    if(_options.viewReg64Bit) command += ' /reg:64';
    const blob = new TextDecoder().decode(await Deno.run({
        cmd: ['cmd','/c',...command.split(' ')],
        stdout: 'piped',
        stderr: 'piped'
    }).output());
    return blob.toString();
}

interface restoreOptions {
    /** @description Specifies the key should be accessed using the 32-bit registry view. */
    viewReg32Bit?: boolean,
    /** @description Specifies the key should be accessed using the 64-bit registry view. */
    viewReg64Bit?: boolean
}
/**
 * @description Restores a registry entry from FileName to KeyName. DO NOT ALLOW USER INPUT.
 */
export async function restore(KeyName: string, FileName: string, _options: restoreOptions = new Object): Promise<string> {
    if(!KeyNameRegex.test(KeyName)) throw new Error(`${KeyName} not of WIN_REG_KEYNAME`);
    let command = `REG RESTORE ${KeyName} ${FileName}`;
    if(_options.viewReg32Bit) command += ' /reg:32';
    if(_options.viewReg64Bit) command += ' /reg:64';
    const blob = new TextDecoder().decode(await Deno.run({
        cmd: ['cmd','/c',...command.split(' ')],
        stdout: 'piped',
        stderr: 'piped'
    }).output());
    return blob.toString();
}

interface loadOptions {
    /** @description Specifies the key should be accessed using the 32-bit registry view. */
    viewReg32Bit?: boolean,
    /** @description Specifies the key should be accessed using the 64-bit registry view. */
    viewReg64Bit?: boolean
}
/**
 * @description Loads a registry entry from FileName to KeyName. DO NOT ALLOW USER INPUT.
 */
export async function load(KeyName: string, FileName: string, _options: loadOptions = new Object): Promise<string> {
    if(!KeyNameRegex.test(KeyName)) throw new Error(`${KeyName} not of WIN_REG_KEYNAME`);
    let command = `REG LOAD ${KeyName} ${FileName}`;
    if(_options.viewReg32Bit) command += ' /reg:32';
    if(_options.viewReg64Bit) command += ' /reg:64';
    const blob = new TextDecoder().decode(await Deno.run({
        cmd: ['cmd','/c',...command.split(' ')],
        stdout: 'piped',
        stderr: 'piped'
    }).output());
    return blob.toString();
}

interface unloadOptions {
    /** @description Specifies the key should be accessed using the 32-bit registry view. */
    viewReg32Bit?: boolean,
    /** @description Specifies the key should be accessed using the 64-bit registry view. */
    viewReg64Bit?: boolean
}
/**
 * @description Unloads the registry entry at KeyName location. DO NOT ALLOW USER INPUT.
 */
export async function unload(KeyName: string, FileName: string, _options: unloadOptions = new Object): Promise<string> {
    if(!KeyNameRegex.test(KeyName)) throw new Error(`${KeyName} not of WIN_REG_KEYNAME`);
    let command = `REG UNLOAD ${KeyName} ${FileName}`;
    if(_options.viewReg32Bit) command += ' /reg:32';
    if(_options.viewReg64Bit) command += ' /reg:64';
    const blob = new TextDecoder().decode(await Deno.run({
        cmd: ['cmd','/c',...command.split(' ')],
        stdout: 'piped',
        stderr: 'piped'
    }).output());
    return blob.toString();
}

interface compareOptions {
    valueName?: string,
    emptyValueName?: boolean,
    subKeys?: boolean,
    /** @description Specifies the key should be accessed using the 32-bit registry view. */
    viewReg32Bit?: boolean,
    /** @description Specifies the key should be accessed using the 64-bit registry view. */
    viewReg64Bit?: boolean
}

/**
 * @description Compares all values under Registry to another Registry. 
 */
export async function compare(KeyName1: string, KeyName2: string, _options: compareOptions = new Object): Promise<string> {
    if(!KeyNameRegex.test(KeyName1)) throw new Error(`${KeyName1} not of WIN_REG_KEYNAME`);
    if(!KeyNameRegex.test(KeyName2)) throw new Error(`${KeyName2} not of WIN_REG_KEYNAME`);
    let command = `REG COMPARE ${KeyName1} ${KeyName2}`;
    if(_options.valueName) command += ` /v ${_options.valueName}`;
    if(_options.emptyValueName) command += ' /ve';
    if(_options.subKeys) command += ' /s';
    if(_options.viewReg32Bit) command += ' /reg:32';
    if(_options.viewReg64Bit) command += ' /reg:64';
    const blob = new TextDecoder().decode(await Deno.run({
        cmd: ['cmd','/c',...command.split(' ')],
        stdout: 'piped',
        stderr: 'piped'
    }).output());
    const lines = blob.toString().split('\r\n').filter((v: string) => v.length !== 0 && !v.includes('The operation completed successfully.') && !v.includes('Result Compared:')).map((v: string) => {
        const arr = v.replace(/\s\s+/g,' ').trim().split(' ');
        return [arr[3],{
            compare: arr[0],
            path: arr[2],
            value: arr.slice(4).join(' ') || null
        }];
    });
    return Object.fromEntries(lines);
}

/**
 * @description Exports key and all subkeys at KeyName location to a .reg file.
 */
export async function exportKey(KeyName: string, FileName: string, _options: saveOptions = new Object): Promise<string> {
    if(!KeyNameRegex.test(KeyName)) throw new Error(`${KeyName} not of WIN_REG_KEYNAME`);
    let command = `REG EXPORT ${KeyName} ${FileName} /y`;
    if(_options.viewReg32Bit) command += ' /reg:32';
    if(_options.viewReg64Bit) command += ' /reg:64';
    const blob = new TextDecoder().decode(await Deno.run({
        cmd: ['cmd','/c',...command.split(' ')],
        stdout: 'piped',
        stderr: 'piped'
    }).output());
    return blob.toString();
}