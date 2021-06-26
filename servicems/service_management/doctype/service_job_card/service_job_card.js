// Copyright (c) 2021, Aakvatech Limited and contributors
// For license information, please see license.txt

frappe.ui.form.on('Service Job Card', {
	onload: function (frm) {
		setMatrialBtn(frm);
	},
	refresh: function (frm) {
		setMatrialBtn(frm);
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