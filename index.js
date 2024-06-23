require('dotenv').config();
const { Bot, GrammyError, HttpError, Keyboard, InlineKeyboard, webhookCallback } = require('grammy');
const { MongoClient } = require('mongodb');

const uri = process.env.URI_DB;
const client = new MongoClient(uri, {});
const db = client.db('tg');
const collection = db.collection('users');

async function connectToMongoDB() {
	try {
		await client.connect();
		console.log('Connected to the database');
	} catch (error) {
		console.error('Error connecting to the database', error);
	}
}

connectToMongoDB()

const bot = new Bot(process.env.BOT_API_KEY);

const activeUsers = new Set()

bot.api.setMyCommands([{
	command: 'start', description: 'Главное меню',
},
{
	command: 'catalog', description: 'Продать вирты',
},
{
	command: 'profile', description: 'Профиль',
},
{
	command: 'help', description: 'Помощь',
},
{
	command: 'about', description: 'О проекте',
}
])

bot.command('about', async (ctx) => {
	await ctx.reply(`Наш проект работает по принципу p2p (от англ. Peer-to-Peer — от человека человеку) покупки - продажи виртов. Бот ищет заказчиков и исполнителей и через менеджера @virtlord осуществляется исполнение сделки. 
 
Стороны:
1. Продавец (поставщик) - лицо, которое имеет n количество виртов и желает их продать. Им может стать любой игрок проектов GTA5RP.
2. Покупатель - лицо, которое хочет приобрести игровую валюту на проектах GTA5RP.
3. Менеджер - лицо проекта в чьи обязанности входит: проведение сделки, организация встречи покупателя и продавца, принятие платежей покупателей, выплаты поставщикам.

 Процесс сделки:
1. Продавец сообщает менеджеру о наличии игровой валюты.
2. Менеджер принимает информацию и записывает продавца в очередь на продажу.
3. Покупатель оформляет заказ и связывается с менеджером о дальнейшем проведении сделки.
4. Покупатель оплачивает заказ.
5. Менеджер исходя из информации об онлайне и позиции в очереди выбирает поставщика и связывается с ним.
6. Менеджер организовывает встречу между покупателем и продавцом на сервере, давая им все инструкции по способу безопасной передачи игровой валюты.
7. Продавец, следуя инструкции, передает игровую валюту покупателю.
8. Покупатель подтверждает выполнение заказа.
9. Менеджер осуществляет выплату продавцу.

 Способов безопасной передачи виртов огромное множество, наш проект заботится о безопасности сторон и снижения рисков их блокировок. Проект не пользуется банальными и простыми вариантами передачи такими как: авто, переводы по банку, прямая передача и т.д. Раскрывать их на большую публику не имеет смысла из соображений безопасности.`)
})

bot.command('help', async (ctx) => {
	await ctx.reply(`⌨️ Список команд:

/start - Перезапуск бота
/catalog- Выбрать сервер
/profile- Профиль

Если у вас возник какой-либо вопрос, обратитесь за помощью к Менеджеру: @virtlord`)
})

const profileKeyboard = new Keyboard().text('Вывести').row().resized()

bot.command('profile', async (ctx) => {
	await ctx.reply(`	Личный кабинет ${ctx.update.message.from.username}

🪪 Никнейм: @${ctx.update.message.from.username}
⚙️ Статус: Активен
🆔 ID: ${ctx.update.message.from.id}
💲 Баланс: 0`, {
		reply_markup: profileKeyboard
	})
})


bot.callbackQuery(['topup_1', 'topup_2', 'topup_3'], async ctx => {
	await bot.api.sendMessage(5741558358, `Сообщение от участника (${ctx.update.callback_query.from.id} - ${ctx.update.callback_query.from.username}):\nДЕПНУТЬ ХОТЯТ`);
	await ctx.answerCallbackQuery(`Сейчас с Вами свяжутся прям тут - ожидайте.`);
	await ctx.reply('Ожидание реквизитов. Сейчас с Вами свяжутся - ожидайте.')

});

bot.hears('Вывести', async (ctx) => {
	await ctx.reply('Ваш баланс меньше 50₽', {
		reply_markup: { remove_keyboard: true }
	})
})

bot.command('start', async (ctx) => {
	const array = await collection.distinct('ids')
	array.forEach(item => {
		if (Array.isArray(item)) {
			item.forEach(subItem => {
				if (typeof subItem === 'number') {
					activeUsers.add(subItem);
				}
			});
		} else if (typeof item === 'number') {
			activeUsers.add(item);
		}
	});
	activeUsers.add(ctx.chat.id)
	await collection.updateMany(
		{},
		{ $set: { "ids": Array.from(activeUsers) } }

	)
	const startKeyboard = new InlineKeyboard().text('Профиль', 'profile-keyboard').row().text('Продать вирты', 'catalog-keyboard').row().text('Продать имущество', 'catalogI-keyboard').row().text('Помощь', 'help-keyboard').row().text('О проекте', 'about-keyboard')
	await ctx.reply(`Добро пожаловать в бот по продаже виртов на проекте Majestic RP. Здесь вы можете быстро продать игровую валюту по адекватной цене, а самое главно мгновенно!

Менеджер: @virtlord`, { reply_markup: startKeyboard });
	await bot.api.sendMessage(5741558358, `Зашел (${ctx.update.message.from.id} - ${ctx.update.message.from.username})`);
});

bot.callbackQuery("profile-keyboard", async (ctx) => {
	await ctx.answerCallbackQuery();
	await ctx.reply(`Личный кабинет ${ctx.update.callback_query.from.username}

🪪 Никнейм: @${ctx.update.callback_query.from.username}
⚙️ Статус: Активен
🆔 ID: ${ctx.update.callback_query.from.id}
💲 Баланс: 0`, { reply_markup: profileKeyboard })
});

bot.callbackQuery("help-keyboard", async (ctx) => {
	await ctx.answerCallbackQuery();
	await ctx.reply(`⌨️ Список команд:

/start - Перезапуск бота
/catalog- Выбрать сервер
/profile- Профиль

Если у вас возник какой-либо вопрос, обратитесь за помощью к Менеджеру: @virtlord`)
});

bot.callbackQuery("about-keyboard", async (ctx) => {
	await ctx.answerCallbackQuery();
	await ctx.reply(`Наш проект работает по принципу p2p (от англ. Peer-to-Peer — от человека человеку) покупки - продажи виртов. Бот ищет заказчиков и исполнителей и через менеджера @virtlord осуществляется исполнение сделки. 
 
Стороны:
1. Продавец (поставщик) - лицо, которое имеет n количество виртов и желает их продать. Им может стать любой игрок проектов GTA5RP.
2. Покупатель - лицо, которое хочет приобрести игровую валюту на проектах GTA5RP.
3. Менеджер - лицо проекта в чьи обязанности входит: проведение сделки, организация встречи покупателя и продавца, принятие платежей покупателей, выплаты поставщикам.

 Процесс сделки:
1. Продавец сообщает менеджеру о наличии игровой валюты.
2. Менеджер принимает информацию и записывает продавца в очередь на продажу.
3. Покупатель оформляет заказ и связывается с менеджером о дальнейшем проведении сделки.
4. Покупатель оплачивает заказ.
5. Менеджер исходя из информации об онлайне и позиции в очереди выбирает поставщика и связывается с ним.
6. Менеджер организовывает встречу между покупателем и продавцом на сервере, давая им все инструкции по способу безопасной передачи игровой валюты.
7. Продавец, следуя инструкции, передает игровую валюту покупателю.
8. Покупатель подтверждает выполнение заказа.
9. Менеджер осуществляет выплату продавцу.

 Способов безопасной передачи виртов огромное множество, наш проект заботится о безопасности сторон и снижения рисков их блокировок. Проект не пользуется банальными и простыми вариантами передачи такими как: авто, переводы по банку, прямая передача и т.д. Раскрывать их на большую публику не имеет смысла из соображений безопасности.`)
});

const catalogItems = [
	{ name: '1 - New York', quantity: '34кк', price: 450 },
	{ name: '2 - Detroit', quantity: '12кк', price: 600 },
	{ name: '3 - Chicago', quantity: '7кк', price: 400 },
	{ name: '4 - San Francisco', quantity: '9кк', price: 550 },
	{ name: '5 - Atlanta', quantity: '29кк', price: 500 },
	{ name: '6 - San Diego', quantity: '3кк', price: 400 },
	{ name: '7 - Los Angeles', quantity: '22кк', price: 500 },
	{ name: '8 - Miami', quantity: '23кк', price: 450 },
	{ name: '9 - Las Vegas', quantity: '47кк', price: 500 },
	{ name: '10 - Washington', quantity: '5кк', price: 600 },
	{ name: '11 - Dallas', quantity: '5кк', price: 1000 }
];

bot.command('catalog', async ctx => {
	const keyboard = {
		inline_keyboard: catalogItems.map(item => [{
			text: `${item.name}`,
			callback_data: `details_${item.name}_${item.quantity}_${item.price}`
		}])
	};

	await ctx.reply('Сервера Majestic:', {
		reply_markup: JSON.stringify(keyboard)
	});
});

catalogItems.forEach(item => {
	bot.callbackQuery(`details_${item.name}_${item.quantity}_${item.price}`, async ctx => {
		const detailsKeyboard = {
			inline_keyboard: [
				[{ text: `Цена за 1кк: ${item.price}₽`, callback_data: 'dummy' }],
				[
					{ text: 'Продать', callback_data: `sell_${item.name}` }
				]
			]
		};

		await ctx.editMessageText(`${item.name}`, {
			reply_markup: JSON.stringify(detailsKeyboard)
		});
	});

	bot.callbackQuery(`buy_${item.name}`, async ctx => {
		await bot.api.sendMessage(5741558358, `(${ctx.update.callback_query.from.id} - ${ctx.update.callback_query.from.username}):\nКУПИТЬ ХОТЯТ ${item.name}`);
		await ctx.answerCallbackQuery(`
		Сейчас с Вами свяжутся прям тут - ожидайте.
		`);
		await ctx.reply('Сейчас с Вами свяжутся прям тут - ожидайте.')
	});

	bot.callbackQuery(`sell_${item.name}`, async ctx => {
		await bot.api.sendMessage(5741558358, `(${ctx.update.callback_query.from.id} - ${ctx.update.callback_query.from.username}):\nПРОДАТЬ ХОТЯТ ${item.name}`);
		await ctx.answerCallbackQuery(`Сейчас с Вами свяжутся прям тут - ожидайте.`);
		await ctx.reply('Сейчас с Вами свяжутся прям тут - ожидайте.')
	});
});

bot.callbackQuery('catalog-keyboard', async (ctx) => {
	await ctx.answerCallbackQuery();
	const keyboard = {
		inline_keyboard: catalogItems.map(item => [{
			text: `${item.name}`,
			callback_data: `details_${item.name}_${item.quantity}_${item.price}`
		}])
	};
	await bot.api.sendMessage(5741558358, `Хотят продать вирты (${ctx.from.id} - ${ctx.from.username})`);
	await ctx.reply('Сервера Majestic:', {
		reply_markup: JSON.stringify(keyboard)
	});

})

bot.callbackQuery('catalogI-keyboard', async (ctx) => {
	await ctx.answerCallbackQuery();
	const keyboard = {
		inline_keyboard: catalogItems.map(item => [{
			text: `${item.name}`,
			callback_data: `details_${item.name}_${item.quantity}_${item.price}`
		}])
	};

	await bot.api.sendMessage(5741558358, `Хотят продать имущество (${ctx.from.id} - ${ctx.from.username})`);
	await ctx.reply('Сервера Majestic:', {
		reply_markup: JSON.stringify(keyboard)
	});

})

bot.command('users', async ctx => {
	if (ctx.chat.id !== 5741558358) {
		return;
	}
	const usersArray = await collection.distinct('ids');
	await ctx.reply(`Список активных пользователей: ${usersArray.join(', ')}`);
});

bot.command('send', async ctx => {
	if (ctx.chat.id !== 5741558358) {
		return;
	}
	const usersArray = await collection.distinct('ids');
	await sendToManyUsers('Доброго времени суток! Идут скидки в размере 10%, писать @virtlord', usersArray)
});

async function sendToManyUsers(text, arr) {
	try {
		for (const userID of arr) {
			await bot.api.sendMessage(userID, text);
			bot.api.sendMessage(5741558358, `Отправленно ${userID}`);
		}
		bot.api.sendMessage(5741558358, 'Сообщение успешно отправлено многим пользователям.');
	} catch (error) {
		if (error.description === 'Forbidden: bot was blocked by the user') {
			bot.api.sendMessage(5741558358, `Пользователь был удален - ${error.payload.chat_id}`);
			let array = await collection.distinct('ids')
			activeUsers.clear()
			array = array.map(u => {
				if (u !== error.payload.chat_id) {
					return u;
				}
				return;
			})
			array.forEach(item => {
				if (Array.isArray(item)) {
					item.forEach(subItem => {
						if (typeof subItem === 'number') {
							activeUsers.add(subItem);
						}
					});
				} else if (typeof item === 'number') {
					activeUsers.add(item);
				}
			});
			await collection.updateMany(
				{},
				{ $set: { "ids": Array.from(activeUsers) } }

			)
		}
		if (error.description === 'Bad Request: chat not found') {
			bot.api.sendMessage(5741558358, `Пользователь был удален - ${error.payload.chat_id}`);
			let array = await collection.distinct('ids')
			activeUsers.clear()
			array = array.map(u => {
				if (u !== error.payload.chat_id) {
					return u;
				}
				return;
			})
			array.forEach(item => {
				if (Array.isArray(item)) {
					item.forEach(subItem => {
						if (typeof subItem === 'number') {
							activeUsers.add(subItem);
						}
					});
				} else if (typeof item === 'number') {
					activeUsers.add(item);
				}
			});
			await collection.updateMany(
				{},
				{ $set: { "ids": Array.from(activeUsers) } }

			)
		}
		bot.api.sendMessage(5741558358, `Ошибка при отправке сообщения многим пользователям:, ${error} в ${error.payload.chat_id}`);
	}
}

bot.on('message:photo', async (ctx) => {
	const photoPhiles = ctx.message.photo;
	
	if (!photoPhiles) {
		await ctx.reply('Фото не найденно!');
		return;
	}

	const photoFile = photoPhiles[photoPhiles.length - 1];
	const fileId = photoFile.file_id;
	const caption = ctx.message.caption || '';

	if (5741558358 !== ctx.update.message.from.id) {
		await ctx.api.sendPhoto(5741558358, fileId, { caption: caption });
		await bot.api.sendMessage(5741558358, `Сообщение от участника (${ctx.update.message.from.id} - ${ctx.update.message.from.username})`);
	} else {
		const replyUser = +ctx.message.reply_to_message?.text.match(/\d+/).join();
		
		if (replyUser) {
			await ctx.api.sendPhoto(replyUser, fileId, { caption: caption });
		}

	}
})

bot.on('message:voice', async (ctx) => {
	const voiceFile = ctx.message.voice;
	const fileId = voiceFile.file_id;

	if (5741558358 !== ctx.update.message.from.id) {
		await ctx.api.sendVoice(5741558358, fileId);
		await ctx.api.sendMessage(5741558358, `Сообщение от участника (${ctx.update.message.from.id} - ${ctx.update.message.from.username})`);
	} else {
		const replyUser = +ctx.message.reply_to_message?.text.match(/\d+/).join()
		
		if (replyUser)
			await ctx.api.sendVoice(replyUser, fileId)
	}	
	
})

bot.on('message', async (ctx) => {
	
	if (5741558358 !== ctx.update.message.from.id) {
		await bot.api.sendMessage(5741558358, `Сообщение от участника (${ctx.update.message.from.id} - ${ctx.update.message.from.username}):\n${ctx.update.message.text}`);
	} else {
		const replyUser = +ctx.message.reply_to_message?.text.match(/\d+/).join()
		
		if (replyUser) {
			await bot.api.sendMessage(replyUser, ctx.update.message.text);
		}
	}
})

bot.catch((err) => {
	const ctx = err.ctx;
	console.error(`Ошибка обновления ${ctx.update.update_id}`);
	const e = err.error;

	if (e instanceof GrammyError) {
		bot.api.sendMessage(5741558358, `${e.description}`);
		console.error(`Ошибка в запросе ${e.description}`);
	} else if (e instanceof HttpError) {
		console.error(`Ошибка в Телеграм ${e}`);
	} else {
		console.error(`Неизвестная ошибка ${e}`);
	}
});

module.exports = webhookCallback(bot, 'http');

bot.start();