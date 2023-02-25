export type ApiResponse<T> =
    | {
          success: true;
          data: T;
      }
    | {
          success: false;
          code: number;
          detail: string | null;
      };

export async function request<T>(
    method: "get" | "post" | "put" | "delete",
    path: string,
    options?: { query?: { [key: string]: any }; data?: { [key: string]: any } }
): Promise<ApiResponse<T>> {
    const queryParams: string =
        options && options.query
            ? `?${new URLSearchParams(options.query).toString()}`
            : "";
    const auth: string | null = window.localStorage.getItem("token");
    const result = await fetch(`/api${path.trimStart()}${queryParams}`, {
        method: method.toUpperCase(),
        headers: auth ? { Authorization: auth } : undefined,
        body:
            (method === "post" || method === "put") && options && options.data
                ? JSON.stringify(options.data)
                : undefined,
    });

    let data: T = (await result.text()) as T;
    try {
        data = JSON.parse(data as string);
    } catch {}

    if (result.status < 400) {
        return { success: true, data: data };
    } else {
        return {
            success: false,
            code: result.status,
            detail:
                data && typeof (data as any).detail === "string"
                    ? (data as any).detail
                    : null,
        };
    }
}

export async function get<T>(
    path: string,
    options?: { query?: { [key: string]: any } }
): Promise<ApiResponse<T>> {
    return await request<T>("get", path, options);
}

export async function del<T>(
    path: string,
    options?: { query?: { [key: string]: any } }
): Promise<ApiResponse<T>> {
    return await request<T>("delete", path, options);
}

export async function put<T>(
    path: string,
    options?: { query?: { [key: string]: any }; data?: { [key: string]: any } }
): Promise<ApiResponse<T>> {
    return await request<T>("put", path, options);
}

export async function post<T>(
    path: string,
    options?: { query?: { [key: string]: any }; data?: { [key: string]: any } }
): Promise<ApiResponse<T>> {
    return await request<T>("post", path, options);
}
