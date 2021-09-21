export interface ITemplateSummaryEntry {
    id: string;
    name: string;
    sender: string;
    counter: number;
    description: string | null;
    created_at: string;
    updated_at: string;
    is_personal: boolean;
    is_public: boolean;
    profile_id: string;
    organization_id: string;
    last_used_at: string | null;
    document_name: string | null;
    star_counter: number;
    tag_name: string | null;
    is_starred: boolean;
}

export interface ITemplatesSummary {
    page: number;
    total: number;
    result: ITemplateSummaryEntry[];
}
