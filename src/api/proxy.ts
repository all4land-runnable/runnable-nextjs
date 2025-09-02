// pages/api/proxy.ts
import type { NextApiRequest, NextApiResponse } from "next";
import axios, { Method } from "axios";

/**
 * 프록시 라우트
 * 클라이언트에서 /api/proxy?url=... 으로 요청하면 해당 url로 중계
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { url, method = "GET" } = req.query;

    if (!url || typeof url !== "string") {
        return res.status(400).json({ error: "url query parameter is required" });
    }

    try {
        const response = await axios.request({
            url,
            method: method as Method,
            headers: {
                ...req.headers,
                host: undefined, // host 헤더 제거
            },
            data: req.body,
            params: req.query,
        });

        res.status(response.status).json(response.data);
    } catch (error) {
        console.error("Proxy Error:", error.message);
        res
            .status(error.response?.status || 500)
            .json(error.response?.data || { error: error.message });
    }
}
