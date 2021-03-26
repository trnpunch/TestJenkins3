export const str = (value: any) => {
    if (!value) { return null; } 
    const text: string = value.replace(/\s+/gm, ' ').trim();
    return text === '' ? null : text;
};