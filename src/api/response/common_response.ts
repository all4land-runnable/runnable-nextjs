export default class CommonResponse<T> {
    code?:number;
    message?:string;
    data?:T;
}