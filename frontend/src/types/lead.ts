type Lead = {
    id: string;
    category?: string;
    title: string;
    content: string;
    url_link: string;
    image_url?: string;
    date: string;
    pitched: boolean;
};

export default Lead;