export const api = {
  icon: '彡',
  name: 'database.do',
  description: 'Durable Object Database',
  url: 'https://database.do/api',
  type: 'https://apis.do/database',
  endpoints: {
    resources: 'https://namespace.database.do',
    list: 'https://namespace.database.do/:resource',
    search: 'https://namespace.database.do/:resource?prop=value',
    new: 'https://namespace.database.do/:resource/new?prop=value',
    get: 'https://namespace.database.do/:resource/:id',
    set: 'https://namespace.database.do/:resource/:id/set?prop=value',
    delete: 'https://namespace.database.do/:resource/:id/delete',
  },
  site: 'https://database.do',
  login: 'https://database.do/login',
  signup: 'https://database.do/signup',
  repo: 'https://github.com/drivly/database.do',
}

export default {
  fetch: (req, env) => env.DATABASE.get(env.DATABASE.idFromName(new URL(req.url).hostname)).fetch(req)
}

export class Database {
  constructor(state, env) {
    this.state = state
    this.env = env
  }
  async fetch(req) {
    const { user, origin, requestId, method, body, time, pathSegments, query } = await this.env.CTX.fetch(req).then(res => res.json())
    // if (!user.authenticated) return Response.redirect(origin + '/login')
    let [ resource, id, action ] = pathSegments
    action = action ? action : body ? 'set' : id == 'new' ? 'set' : 'get'
    id = id == 'new' ? crypto.randomUUID() : id
    let data = id ? await this.state.storage.get(id) : await this.state.storage.list(query).then(list => Object.fromEntries(list))
    let links = id ? {
      self: req.url,
      set: data?.localTime ? `${origin}/${resource}/${id}?inCity=${user.city}` : `${origin}/${resource}/${id}?localTime=${user.localTime}`,
      delete: `${origin}/${resource}/${id}/delete`
    } : {
      self: req.url,
      start: `${origin}/${resource}`,
      next: `${origin}/${resource}?`,
      prev: `${origin}/${resource}?`,
      last: `${origin}/${resource}/${id}`,
    }
    if (action == 'set') {
      data = { 
        id,
        url: `${origin}/${resource}/${id}`,
        ...data,
        ...body,
        ...query,
        createdBy: data?.createdBy ?? user.email ?? user.ip,
        createdAt: data?.createdAt ?? time,
        createdWith: data?.createdWith ?? requestId,
        updatedBy: user.email ?? user.ip,
        updatedAt: time,
        updatedWith: requestId,
      }
      this.state.storage.put(id, data)
    }
    
    return new Response(JSON.stringify({ api, resource, id, action, links, data, user }, null, 2), { headers: { 'content-type': 'application/json; charset=utf-8' }})
  }
}
