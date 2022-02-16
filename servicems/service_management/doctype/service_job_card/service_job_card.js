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
			let d = new frappe.ui.Dialog({
				title: "Select Item to Unbill",
				fields: [
					{
						fieldname: "open_space",
						fieldtype: "HTML"
					}
				]
			});
			var $wrapper;
			var $results;
			var $placeholder;
			var columns = ["item", "qty", "rate", "stock_entry"];

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
					$results.append($placeholder)
				} else {
					$results.append(make_list_ofrows(columns, true));
					for (let i = 0; i < records.length; i++) {
						$results.append(make_list_ofrows(columns, true, records[i]))
					};
				}
			});

			$wrapper = d.fields_dict.open_space.$wrapper.append(`<div class="results" 
				style="border: 1px solid #d1d8dd; border-radius: 3px; width 800px; height: 400px; overflow: auto;"></div>`);
			$results = $wrapper.find('.results');
			$placeholder = $(`<div class="multiselect-empty-state">
						<span class="text-center" style="margin-top: -40px;">
							<i class="fa fa-2x fa-heartbeat text-extra-muted"></i>
							<p class="text-extra-muted">No Items found</p>
						</span>
					</div>`);
			$results.on('click', '.list-item--head :checkbox', (e) => {
				$results.find('.list-item-container .list-row-check')
					.prop("checked", ($(e.target).is(':checked')));
			});

			d.set_primary_action(__('Select Item'), function () {
				let checked_items = get_checked_lrpt_items($results);
				if (checked_items.length > 0) {
					frappe.call("servicems.service_management.doctype.service_job_card.service_job_card.get_selected_items", {
						items: checked_items
					}).then(r => {
						frm.reload_doc()
					})
					d.hide();
				}
			});
			d.show()
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

var make_list_ofrows = function (columns, item, result = {}) {
	var me = this;
	let head = Object.keys(result).length === 0;
	let contents = ``;
	columns.forEach(function (column) {
		contents += `<div class="list-item__content ellipsis">
			${head ? `<span class="ellipsis"><b>${__(frappe.model.unscrub(column))}</b></span>`

				: (column !== "name" ? `<span class="ellipsis">${__(result[column])}</span>`
					: `<a class="list-id ellipsis">${__(result[column])}</a>`)
			}
		</div>`;
	});

	let $row = $(`<div class="list-item">
		<div class="list-item__content" style="flex: 0 0 10px;">
			<input type="checkbox" class="list-row-check" ${result.checked ? 'checked' : ''}>
		</div>
		${contents}
	</div>`);

	$row = list_rows(head, $row, result, item);
	return $row;
};

var list_rows = function (head, $row, result, item) {
	if (item) {
		head ? $row.addClass('list-item--head')
			: $row = $(`<div class="list-item-container"
				data-item = "${result.item}"
				data-qty = "${result.qty}"
				data-rate = "${result.rate}"
				data-stock_entry = "${result.stock_entry}"
				data-parent = "${result.parent}"
				data-parenttype = "${result.parenttype}"
			</div>`).append($row);
	}
	return $row;
};

var get_checked_lrpt_items = function ($results) {
	return $results.find('.list-item-container').map(function () {
		let checked_items = {};
		if ($(this).find(".list-row-check:checkbox:checked").length > 0) {
			checked_items["item"] = $(this).attr("data-item");
			checked_items["qty"] = $(this).attr("data-qty");
			checked_items["rate"] = $(this).attr("data-rate");
			checked_items["stock_entry"] = $(this).attr("data-stock_entry");
			checked_items["parent"] = $(this).attr("data-parent");
			checked_items["parenttype"] = $(this).attr("data-parenttype");
			return checked_items;
		}
	}).get();
};