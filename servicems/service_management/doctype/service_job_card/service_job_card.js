// Copyright (c) 2021, Aakvatech Limited and contributors
// For license information, please see license.txt

frappe.ui.form.on('Service Job Card', {
	onload: function (frm) {
		setMatrialBtn(frm);

	},
	refresh: function (frm) {
		setMatrialBtn(frm);
		cur_frm.set_query("item", "parts", () => {
			return {
				query: "servicems.service_management.doctype.service_settings.service_settings.get_filtered_items",
			};
		});
	},

	unbill_item: function (frm) {
		if (frm.doc.docstatus == 0) {
			var parent = frm.doc.name;
			frappe.db.get_list("Supplied Parts", {
				fields: ["item", "qty", "rate", "stock_entry", "parent", "parenttype"],
				filters: {
					parent: parent,
					is_billable: 1,
					is_return: 0
				}
			}).then(records => {
				if (!records){
				} else {
					let d = new frappe.ui.Dialog({
						title: "Select Item to Unbill",
						fields: [
							{
								fieldname: "open_space",
								fieldtype: "HTML",
								width: "1300px"
							}
						],

					});
					
					let html = `<table class="table table-hover" style="width:100%;">
						<colgroup>
							<col width="6%">
							<col width="35%">
							<col width="5%">
							<col width="15%">
							<col width="5%">
							<col width="12%">
							<col width="5%">
							<col width="15%">
						</colgroup>
						<tr style="background-color: #D3D3D3;">
							<th></th>
							<th>Item</th>
							<th></th>
							<th>Rate</th>
							<th></th>
							<th>Qty</th>
							<th></th>
							<th>Qty to Return</th>
						</tr>`
					
					records.forEach(row => {
						html += `<tr>
							<td><input type="checkbox"/></td>
							<td id="item" data-item="${row.item}">${row.item}</td>
							<td id="stock_entry" data-stock_entry="${row.stock_entry}"></td>
							<td id="rate" data-rate="${row.rate}">${row.rate}</td>
							<td id="parent" data-parent="${row.parent}"></td>
							<td id="qty" data-qty="${row.qty}">${row.qty}</td>
							<td id="parenttype" data-parenttype="${row.parenttype}"></td>
							<td id="qty_to_return"></td>
						</tr>`
					});
					html += `</table>`

					let wrapper = d.fields_dict.open_space.$wrapper
					
					wrapper.html(html);

					wrapper.find("table").hover(function() {
						get_qty_to_return(wrapper);
					});
					
					d.set_primary_action(__("Select Item"), function() {
						let items = [];
						
						wrapper.find('tr:has(input:checkbox:checked)').each(function() {
							items.push({
								"item":  $(this).find("#item").attr("data-item"),
								"stock_entry": $(this).find("#stock_entry").attr("data-stock_entry"),
								"rate": $(this).find("#rate").attr("data-rate"),
								"parent": $(this).find("#parent").attr("data-parent"),
								"qty": $(this).find("#qty").attr("data-qty"),
								"parenttype": $(this).find("#parenttype").attr("data-parenttype"),
								"qty_to_return": $(this).find("#parenttype").attr("data-qty_to_return")
							});
						});

						if (items.length > 0) {
							frappe.call("servicems.service_management.doctype.service_job_card.service_job_card.get_selected_items", {
								items: items
							}).then(r => {
								frm.reload_doc()
							});
							d.hide();
						} else {
							frappe.msgprint({
								title: __('Message'),
								indicator: 'red',
								message: __(
									'<h4 class="text-center" style="background-color: #D3D3D3; font-weight: bold;">\
									No any Item selected<h4>'
								)
							});
						}
					});
					
					d.show();
				};
			});
		}
	}
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

var get_qty_to_return = function(wrapper) {
	$.each(wrapper.find("tr:has(input:checkbox)"), function(index, row) {
		$(this).on("click", "input:checkbox", function() {
			if ($("input:checkbox").is(":checked") == true) {
				if ($(this).parent().siblings().last().html() == "") {
					$("<input type='number' id='return' style='border: 3px solid red'>")
					.appendTo($(this).parent().siblings().last());

					$("#return").on("input", function() {
						let row_qty = $(this).parent().siblings().eq(-2).text();

						if ($("#return").val() <= row_qty) {
							$(this).parent().siblings().last().attr("data-qty_to_return", $("#return").val());
							$("#return").css("border", "1px solid blue");

						} else {
							$("#return").css({ "border": "4px solid red", "font-weight": "bold" }).val(0);
							frappe.msgprint({
								title: __('Message'),
								indicator: 'red',
								message: __(
									'<h4 class="text-center" style="background-color: orange; font-weight: bold;">\
									Qty to return cannot be greater than Qty<h4>'
								)
							});
						};
					});
				}
			} else {
				if ($("input:checkbox").is(":checked") == false) {
					$(this).parent().siblings().last().html("");
				}
			}
		});
	});
};