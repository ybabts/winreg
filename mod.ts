// Copyright 2021 Tyler Mueller. All rights reserved. MIT license.

function _keyNameFormatError(KeyName: string): Error {
    return new Error(`Argument KeyName ${KeyName} is not formatted properly`);
}

function _buildCommand(CMD: string, options: options, defaults: Record<string, unknown>, translations: Record<string, string>) {
    const command = ['REG', CMD];
    const finalOptions = Object.assign(defaults, options);
    for(const [prop, trans] of Object.entries(translations)) if(finalOptions[prop]) command.push(typeof finalOptions[prop] === 'boolean' ? trans : trans.concat(` "${finalOptions[prop]}"`));
    return command.join(' ');
}

async function _checkPermissions(): Promise<void> {
    if(Deno.build.os !== 'windows') throw new Error(`${Deno.build.os} is not supported`);
    if((await Deno.permissions.query({ name: 'run' })).state === 'prompt') Deno.permissions.request({ name: 'run' });
    if((await Deno.permissions.query({ name: 'run' })).state === 'denied') throw new Error('winreg requires run permission to function');
}

await _checkPermissions();

export const KEYNAME_REGEX = /\w+(?:\\\w+)+$/;
export type RegistryDataType = 'REG_SZ' | 'REG_MULTI_SZ' | 'REG_EXPAND_SZ' | 'REG_DWORD' | 'REG_QWORD' | 'REG_BINARY' | 'REG_NONE';

export interface options {
    /** @description Specifies the key should be accessed using the 32-bit registry view. */
    viewReg32Bit?: boolean,
    /** @description Specifies the key should be accessed using the 64-bit registry view. */
    viewReg64Bit?: boolean
}

export interface queryOptions extends options {
    /** @description Queries for a specific registry key value. If omitted, all values at KeyName location are queried. */
    queryValue?: string,
    /** @description Queries for default or empty values at the KeyName location. */
    queryDefault?: boolean,
    /** @description Queries all subkeys and values recursively. */
    querySubkeys?: boolean,
    /** @description Specifies the seperator (length of 1 character only) in data string for type REG_MULTI_SZ. Defaults to "\0" as the seperator. */
    specifiedSeperator?: string,
    /** @description Specifies the data or pattern to search for. Default is "*". */
    searchPattern?: string,
    /** @description Specifies to search in the key names only. Requires searchPattern. */
    searchKeyNamesOnly?: boolean,
    /** @description Specifies to search in the data only. Requires searchPattern. */
    searchDataOnly?: boolean,
    /** @description Specifies that the search is case sensitive. Default search is case insensitive. Requires searchPattern. */
    caseSensitive?: boolean,
    /** @description Specifies to only return exact matches. By default all matches are returned. Requires searchPattern. */
    onlyReturnExactMatches?: boolean
    /** @description Specifies registry value data type. */
    queryDataType?: RegistryDataType,
    /** @description Verbose: shows the numeric equivalent for the type of the valuename. */
    verboseReturn?: boolean
}

interface queryResponse {
    type: RegistryDataType,
    value: string
}

/**
 * @description Queries for registry keys in the KeyName path, returns a Record of key value pair results. DO NOT ALLOW USER INPUT.
 * @link https://github.com/ybabts/winreg#query 
 */
export async function query(KeyName: string, _options: queryOptions = new Object): Promise<Record<string, queryResponse>> {
    /** @todo Currently does not work with root keyname paths like HKEY_CURRENT_USER */
    // if(!KEYNAME_REGEX.test(KeyName)) throw _keyNameFormatError(KeyName);
    const translation = {
        queryValue: '/v',
        queryDefault: '/ve', 
        querySubkeys: '/s',
        specifiedSeperator: '/se',
        searchPattern: '/f',
        searchKeyNamesOnly: '/k',
        searchDataOnly: '/d',
        caseSensitive: '/c',
        onlyReturnExactMatches: '/e',
        queryDataType: '/t',
        verboseReturn: '/z',
        viewReg32Bit: '/reg:32',
        viewReg64Bit: '/reg:64'
    };
    const command = _buildCommand(`QUERY ${KeyName}`, _options, Object.fromEntries(Object.keys(translation).map(v => [v,false])), translation);
    const blob = new TextDecoder().decode(await Deno.run({
        cmd: ['cmd','/c',...command.split(' ')],
        stdout: 'piped'
    }).output());
    /** @todo This garbage needs to get refactored. Also needs to include KeyName paths response */
    const lines = blob.toString().split('\r\n').filter((v: string) => v.length !== 0 && !v.includes(KeyName) && !v.includes('End of search:')).map((v: string) => {
        const arr = v.replace(/\s\s+/g,' ').trim().split(' ');
        return [arr[0],{
            type: arr[1],
            value: arr.slice(2).join(' ') || null
        }];
    });
    return Object.fromEntries(lines);
}

interface addOptions extends options {
    addValueName?: string,
    addDefaultName?: boolean,
    addDataType?: RegistryDataType,

}

// export async function add(KeyName: string, _options: addOptions = new Object) {

// }