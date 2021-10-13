// Copyright (c) 2021, Aakvatech Limited and contributors
// For license information, please see license.txt

frappe.ui.form.on('Service Job Card', {
	onload: function (frm) {
		setMatrialBtn(frm);

	},
	refresh: function (frm) {
		setMatrialBtn(frm);
		cur_frm.set_query("item", "parts", () => {
			// let d = locals[cdt][cdn];
			return {
				query: "servicems.service_management.doctype.service_settings.service_settings.get_filtered_items",
			};
		});
	},
});


const setMatrialBtn = frm => {
	if (!frm.is_dirty() && frm.doc.docstatus == 0) {
		frm.add_custom_button('Create Stock Entry', () => {
			createStockEntry(frm);
		});
	}
	else {
		frm.remove_custom_button('Create Stock Entry');
	}
};

const createStockEntry = async function (frm) {
	if (frm.is_dirty()) {
		await frm.save();
	}
	frm.call('create_stock_entry', { type: "call" })
		.then(r => {
			frm.reload_doc();
		});
};
