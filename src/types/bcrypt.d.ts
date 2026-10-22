declare module 'bcrypt' {
  function hash(data: string | Buffer, saltOrRounds: number | string): Promise<string>;
  function compare(data: string | Buffer, encrypted: string): Promise<boolean>;
  function genSalt(rounds?: number): Promise<string>;
  function hashSync(data: string | Buffer, saltOrRounds: number | string): string;
  function compareSync(data: string | Buffer, encrypted: string): boolean;
  function genSaltSync(rounds?: number): string;

  const bcrypt: {
    hash: typeof hash;
    compare: typeof compare;
    genSalt: typeof genSalt;
    hashSync: typeof hashSync;
    compareSync: typeof compareSync;
    genSaltSync: typeof genSaltSync;
  };

  export { hash, compare, genSalt, hashSync, compareSync, genSaltSync };
  export default bcrypt;
}
