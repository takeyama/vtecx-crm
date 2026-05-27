export = VtecxApp
export as namespace VtecxApp

declare namespace VtecxApp {
	interface Request {
		feed: Feed
	}
	interface MessageResponse {
		feed: Feed
	}
	interface Feed {
		entry?: Entry[],
		title?: string,
		subtitle?: string,
		rights?: string
	}
	interface Entry {
		id?: string,
		title?: string,
		subtitle?: string,
		rights?: string,
		summary?: string,
		content?: Content,
		link?: Link[],
		contributor?: Contributor[],
		published?: string,
		updated?: string,
		customer?:Customer,
		contact?:Contact,
		deal?:Deal,
		activity?:Activity,
		userprofile?:Userprofile
	}
	interface Content {
		______text: string
	}
	interface Link {
		___href?: string,
		___rel?: string,
		___title?: string
	}
	interface Contributor {
		uri?: string,
		email?: string
	}
	interface Customer {
		name?:string,
		name_kana?:string,
		industry?:string,
		company_size?:string,
		phone?:string,
		fax?:string,
		postal_code?:string,
		address?:string,
		website?:string,
		status?:string,
		source?:string,
		annual_revenue?:number,
		assigned_uid?:string,
		memo?:string,
		is_deleted?:boolean
	}
	interface Contact {
		family_name?:string,
		given_name?:string,
		family_name_kana?:string,
		given_name_kana?:string,
		department?:string,
		title?:string,
		email?:string,
		phone?:string,
		mobile?:string,
		is_primary?:boolean,
		memo?:string,
		is_deleted?:boolean
	}
	interface Deal {
		name?:string,
		customer_uri?:string,
		amount?:number,
		probability?:number,
		stage?:string,
		expected_close_date?:any,
		actual_close_date?:any,
		contact_uri?:string,
		assigned_uid?:string,
		memo?:string,
		is_deleted?:boolean
	}
	interface Activity {
		activity_type?:string,
		subject?:string,
		activity_date?:any,
		deal_uri?:string,
		description?:string,
		outcome?:string,
		next_action?:string,
		contact_uri?:string,
		created_uid?:string,
		is_deleted?:boolean
	}
	interface Userprofile {
		display_name?:string
	}
}