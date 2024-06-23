import { Context, Schema, h} from 'koishi'
export const name = 'yoake-ollama-bot'

export interface Config {
  url: string
  model: string
  vits_url: string
  vits_model: string,
  tts: string
}


export const Config: Schema<Config> = Schema.object({
  url: Schema.string().description('配置ollama的接口url地址和端口').default("http://127.0.0.1:11434"),
  model: Schema.string().required().description("请选择你的ollama运行的模型名称,例如:qwen,gemma:7b,llama3等"),
  vits_url: Schema.string().description("配置vits语音合成接口的地址和端口").default("http://127.0.0.1:23456"),
  vits_model: Schema.union(['0', '1', '2']).description("选择语音模型"),
  tts: Schema.union(['vits', 'w2v2-vits', 'bert-vits2', 'gpt-sovits']).required().description("请选择TTS合成器")
})
//发送的数据段
let data = {
  "model": "",
  "messages": [],
  "stream": false
}
export function apply(ctx: Context, config: Config) {
  ctx.command('chat <message:text>', '输入对话文本')
    .example('chat 你好')
    .action(async (_, message) => {
      //配置交给ollama的参数
      data.model = config.model
      //判断下messages数据条数，当长度超过6条时，只取最近6条信息+最近的提问
      if (data.messages.length > 6) {
        data.messages = data.messages.slice(-6)
      }
      data.messages.push({ "role": "user", "content": message })
      // 交给ollama的数据
      try {
        // @ts-ignore
        let res = await ctx.http.post(`${config.url}/api/chat`, data)
        data.messages.push(res.message)
        //语音合成转换
        // @ts-ignore
        let vits = await ctx.http.get(`${config.vits_url}/voice/${config.tts}?text=${res.message.content}&id=${config.vits_model}&noisew=0.6`)
        //生成随机数0-1四舍五入，当为0时生成语音，当为1是生成文字
        let a = Math.round(Math.random())
        if (a) {
          return res.message.content
        } else {
          return h.audio(vits, 'audio/wav')
        }
      }
      catch (e) {
        console.log(e)
        return '发生错误，请联系管理员！'
      }
    })

}