export type News = {
    status?: string;
    ort?: string;
    title?: string;
    newskommentar?: string;
    statusComment?:string;
    userEmail:string;
    created_at: string;
    newsId: number | null;
    is_private: number | boolean;
}